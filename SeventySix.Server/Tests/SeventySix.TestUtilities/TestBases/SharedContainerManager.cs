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
using Testcontainers.PostgreSql;

namespace SeventySix.TestUtilities.TestBases;

/// <summary>
/// Manages a shared PostgreSQL container across all test fixtures.
/// Thread-safe singleton ensures only one container per test run.
/// </summary>
public static class SharedContainerManager
{
	private static readonly SemaphoreSlim InitLock =
		new(1, 1);
	private static PostgreSqlContainer? Container;
	private static string? MasterConnectionString;
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
			if (MasterConnectionString is not null)
			{
				return MasterConnectionString;
			}

			Container =
				new PostgreSqlBuilder()
				.WithImage("postgres:16-alpine")
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
	/// Creates an isolated database for a test fixture and applies migrations.
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

		await using (NpgsqlConnection connection =
			new(masterConnection))
		{
			await connection.OpenAsync();
			await using NpgsqlCommand command =
				new(
				$"CREATE DATABASE \"{databaseName}\"",
				connection);
			await command.ExecuteNonQueryAsync();
		}

		NpgsqlConnectionStringBuilder builder =
			new(masterConnection)
			{
				Database = databaseName,
			};
		string connectionString = builder.ToString();

		await ApplyMigrationsAsync(connectionString);

		DatabaseConnections.TryAdd(databaseName, connectionString);
		return connectionString;
	}

	private static async Task ApplyMigrationsAsync(string connectionString)
	{
		DbContextOptions<IdentityDbContext> identityOptions =
			new DbContextOptionsBuilder<IdentityDbContext>()
				.UseNpgsql(connectionString)
				.Options;
		await using (IdentityDbContext context =
			new(identityOptions))
		{
			await context.Database.MigrateAsync();
		}

		DbContextOptions<LoggingDbContext> loggingOptions =
			new DbContextOptionsBuilder<LoggingDbContext>()
				.UseNpgsql(connectionString)
				.Options;
		await using (LoggingDbContext context =
			new(loggingOptions))
		{
			await context.Database.MigrateAsync();
		}

		DbContextOptions<ApiTrackingDbContext> apiTrackingOptions =
			new DbContextOptionsBuilder<ApiTrackingDbContext>()
				.UseNpgsql(connectionString)
				.Options;
		await using (ApiTrackingDbContext context =
			new(apiTrackingOptions))
		{
			await context.Database.MigrateAsync();
		}

		DbContextOptions<ElectronicNotificationsDbContext> electronicNotificationsOptions =
			new DbContextOptionsBuilder<ElectronicNotificationsDbContext>()
				.UseNpgsql(connectionString)
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
			DatabaseConnections.Clear();
		}
	}
}