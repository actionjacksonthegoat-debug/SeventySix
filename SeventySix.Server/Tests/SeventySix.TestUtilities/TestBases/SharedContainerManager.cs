// <copyright file="SharedContainerManager.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Concurrent;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using SeventySix.ApiTracking;
using SeventySix.ElectronicNotifications;
using SeventySix.Identity;
using SeventySix.Logging;
using SeventySix.Shared.Constants;
using Testcontainers.PostgreSql;

namespace SeventySix.TestUtilities.TestBases;

/// <summary>
/// Manages a shared PostgreSQL container across all test fixtures.
/// Thread-safe singleton ensures only one container per test run.
/// Uses template database pattern for fast database creation.
/// </summary>
public static class SharedContainerManager
{
	private const string TemplateDbName = "test_template";
	private static readonly SemaphoreSlim InitLock =
		new(1, 1);
	private static readonly SemaphoreSlim TemplateLock =
		new(1, 1);
	private static PostgreSqlContainer? Container;
	private static string? MasterConnectionString;
	private static bool TemplateCreated;
	private static readonly ConcurrentDictionary<
		string,
		string
	> DatabaseConnections = new();

	/// <summary>
	/// Gets or creates the shared PostgreSQL container.
	/// Thread-safe - only one container created regardless of how many fixtures call this.
	/// </summary>
	/// <returns>
	/// The connection string for the master database.
	/// </returns>
	public static async Task<string> GetOrCreateContainerAsync()
	{
		if (MasterConnectionString is not null)
		{
			return MasterConnectionString;
		}

		await InitLock.WaitAsync();
		try
		{
			// codeql[cs/constant-condition] -- Double-checked locking pattern: intentional re-check inside lock
			if (MasterConnectionString is not null)
			{
				return MasterConnectionString;
			}

			Container =
					new PostgreSqlBuilder("postgres:16-alpine")
						.WithDatabase("postgres")
						.WithUsername("postgres")
						.WithPassword("test_password")
						.WithCleanUp(true)
						.Build();

			await Container.StartAsync();
			MasterConnectionString =
				Container.GetConnectionString();
			return MasterConnectionString;
		}
		finally
		{
			InitLock.Release();
		}
	}

	/// <summary>
	/// Creates an isolated database for a test fixture using template database pattern.
	/// First call creates template with migrations, subsequent calls clone the template.
	/// </summary>
	/// <param name="databaseName">
	/// Unique database name for the fixture.
	/// </param>
	/// <returns>
	/// Connection string for the isolated database.
	/// </returns>
	public static async Task<string> CreateDatabaseAsync(string databaseName)
	{
		if (
			DatabaseConnections.TryGetValue(
				databaseName,
				out string? existingConnection))
		{
			return existingConnection;
		}

		string masterConnection =
			await GetOrCreateContainerAsync();

		// Ensure template exists (thread-safe, only created once)
		await EnsureTemplateCreatedAsync(masterConnection);

		// Clear all connection pools to ensure no lingering connections to template
		// This prevents "source database is being accessed by other users" errors
		NpgsqlConnection.ClearAllPools();

		// Create database from template with retry logic for concurrent access
		const int maxRetries = 3;
		for (int attempt = 1; attempt <= maxRetries; attempt++)
		{
			try
			{
				await using NpgsqlConnection connection =
					new(masterConnection);
				await connection.OpenAsync();
				await using NpgsqlCommand command =
					new(
					$"CREATE DATABASE \"{databaseName}\" TEMPLATE \"{TemplateDbName}\"",
					connection);
				await command.ExecuteNonQueryAsync();
				break;
			}
			catch (PostgresException exception) when (
				exception.SqlState == "55006" && attempt < maxRetries)
			{
				// Template is being accessed by other users, wait and retry
				NpgsqlConnection.ClearAllPools();

				// Pragmatic exception: Task.Delay for container retry backoff in test infrastructure.
				// Not a test assertion — exponential backoff avoids PostgreSQL template lock contention.
				await Task.Delay(100 * attempt);
			}
		}

		NpgsqlConnectionStringBuilder builder =
			new(masterConnection)
			{
				Database = databaseName,
			};
		string connectionString =
			builder.ToString();

		DatabaseConnections.TryAdd(databaseName, connectionString);
		return connectionString;
	}

	/// <summary>
	/// Creates the template database with all migrations applied.
	/// Thread-safe - only created once regardless of concurrent calls.
	/// </summary>
	private static async Task EnsureTemplateCreatedAsync(string masterConnection)
	{
		if (TemplateCreated)
		{
			return;
		}

		await TemplateLock.WaitAsync();
		try
		{
			// codeql[cs/constant-condition] -- Double-checked locking pattern: intentional re-check inside lock
			if (TemplateCreated)
			{
				return;
			}

			// Check if template database already exists (handles container reuse scenarios)
			bool templateExists = false;
			await using (NpgsqlConnection checkConnection =
				new(masterConnection))
			{
				await checkConnection.OpenAsync();
				await using NpgsqlCommand checkCommand =
					new(
					$"SELECT 1 FROM pg_database WHERE datname = '{TemplateDbName}'",
					checkConnection);
				object? result =
					await checkCommand.ExecuteScalarAsync();
				templateExists =
					result is not null;
			}

			if (templateExists)
			{
				// Template exists but may be incomplete from previous failed run
				// Drop it and recreate to ensure clean state
				NpgsqlConnection.ClearAllPools();
				await using NpgsqlConnection dropConnection =
					new(masterConnection);
				await dropConnection.OpenAsync();
				await using NpgsqlCommand dropCommand =
					new(
					$"DROP DATABASE IF EXISTS \"{TemplateDbName}\" WITH (FORCE)",
					dropConnection);
				await dropCommand.ExecuteNonQueryAsync();
			}

			// Create template database
			await using (NpgsqlConnection connection =
				new(masterConnection))
			{
				await connection.OpenAsync();
				await using NpgsqlCommand command =
					new(
					$"CREATE DATABASE \"{TemplateDbName}\"",
					connection);
				await command.ExecuteNonQueryAsync();
			}

			// Apply migrations to template
			NpgsqlConnectionStringBuilder builder =
				new(masterConnection)
				{
					Database = TemplateDbName,
				};
			string templateConnectionString = builder.ToString();

			await ApplyMigrationsAsync(templateConnectionString);

			// Clear all connection pools to ensure no lingering connections to template
			// This is required because PostgreSQL won't allow using a template database
			// while there are active connections to it
			NpgsqlConnection.ClearAllPools();

			TemplateCreated = true;
		}
		finally
		{
			TemplateLock.Release();
		}
	}

	private static async Task ApplyMigrationsAsync(string connectionString)
	{
		DbContextOptions<IdentityDbContext> identityOptions =
			new DbContextOptionsBuilder<IdentityDbContext>()
				.UseNpgsql(
					connectionString,
					npgsqlOptions =>
						npgsqlOptions.MigrationsHistoryTable(
							DatabaseConstants.MigrationsHistoryTableName,
							SchemaConstants.Identity))
				.Options;
		await using (IdentityDbContext context =
			new(identityOptions))
		{
			await context.Database.MigrateAsync();
		}

		DbContextOptions<LoggingDbContext> loggingOptions =
			new DbContextOptionsBuilder<LoggingDbContext>()
				.UseNpgsql(
					connectionString,
					npgsqlOptions =>
						npgsqlOptions.MigrationsHistoryTable(
							DatabaseConstants.MigrationsHistoryTableName,
							SchemaConstants.Logging))
				.Options;
		await using (LoggingDbContext context =
			new(loggingOptions))
		{
			await context.Database.MigrateAsync();
		}

		DbContextOptions<ApiTrackingDbContext> apiTrackingOptions =
			new DbContextOptionsBuilder<ApiTrackingDbContext>()
				.UseNpgsql(
					connectionString,
					npgsqlOptions =>
						npgsqlOptions.MigrationsHistoryTable(
							DatabaseConstants.MigrationsHistoryTableName,
							SchemaConstants.ApiTracking))
				.Options;
		await using (ApiTrackingDbContext context =
			new(apiTrackingOptions))
		{
			await context.Database.MigrateAsync();
		}

		DbContextOptions<ElectronicNotificationsDbContext> electronicNotificationsOptions =
			new DbContextOptionsBuilder<ElectronicNotificationsDbContext>()
				.UseNpgsql(
					connectionString,
					npgsqlOptions =>
						npgsqlOptions.MigrationsHistoryTable(
							DatabaseConstants.MigrationsHistoryTableName,
							SchemaConstants.ElectronicNotifications))
				.Options;
		await using (ElectronicNotificationsDbContext context =
			new(electronicNotificationsOptions))
		{
			await context.Database.MigrateAsync();
		}
	}

	/// <summary>
	/// Disposes the shared container. Called by test assembly cleanup.
	/// </summary>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	public static async Task DisposeAsync()
	{
		if (Container is not null)
		{
			await Container.DisposeAsync();
			Container = null;
			MasterConnectionString = null;
			TemplateCreated = false;
			DatabaseConnections.Clear();
		}
	}
}