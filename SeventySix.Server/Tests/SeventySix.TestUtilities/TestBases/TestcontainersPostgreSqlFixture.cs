// <copyright file="TestcontainersPostgreSqlFixture.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Npgsql;
using SeventySix.Identity;
using SeventySix.Logging;
using SeventySix.ApiTracking;
using Testcontainers.PostgreSql;

namespace SeventySix.TestUtilities.TestBases;

/// <summary>
/// PostgreSQL fixture that creates a Testcontainers database instance for Data layer tests.
/// Uses Testcontainers for isolated, reproducible testing without external dependencies.
/// Each test class gets its own isolated database to enable parallel test execution.
/// </summary>
public sealed class TestcontainersPostgreSqlFixture : BasePostgreSqlFixture
{
	private readonly PostgreSqlContainer PostgreSqlContainer;
	private readonly string DatabaseName;
	private string? _connectionString;

	/// <summary>
	/// Initializes a new instance of the <see cref="TestcontainersPostgreSqlFixture"/> class.
	/// </summary>
	public TestcontainersPostgreSqlFixture()
	{
		// Generate unique database name per test class instance
		DatabaseName = $"test_{Guid.NewGuid():N}";

		PostgreSqlContainer = new PostgreSqlBuilder()
			.WithImage("postgres:16-alpine")
			.WithDatabase("postgres") // Connect to default postgres database initially
			.WithUsername("postgres")
			.WithPassword("test_password")
			.WithCleanUp(true)
			.Build();
	}

	/// <summary>
	/// Gets the connection string for the isolated test database.
	/// </summary>
	public override string ConnectionString => _connectionString ?? throw new InvalidOperationException("Fixture not initialized. Call InitializeAsync first.");

	/// <summary>
	/// Starts the PostgreSQL container, creates an isolated database, and applies migrations if needed.
	/// Called once before all tests in the test class.
	/// </summary>
	/// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
	public override async Task InitializeAsync()
	{
		// Start the container
		await PostgreSqlContainer.StartAsync();

		// Create unique database for this test class
		string masterConnectionString = PostgreSqlContainer.GetConnectionString();
		await using (NpgsqlConnection masterConnection = new(masterConnectionString))
		{
			await masterConnection.OpenAsync();
			await using NpgsqlCommand createDbCommand = new($"CREATE DATABASE {DatabaseName}", masterConnection);
			await createDbCommand.ExecuteNonQueryAsync();
		}

		// Build connection string for the new database
		NpgsqlConnectionStringBuilder builder = new(masterConnectionString)
		{
			Database = DatabaseName
		};
		_connectionString = builder.ToString();

		// Apply migrations for Identity bounded context
		DbContextOptions<IdentityDbContext> identityOptions = new DbContextOptionsBuilder<IdentityDbContext>()
			.UseNpgsql(ConnectionString)
			.Options;
		await using (IdentityDbContext identityContext = new(identityOptions))
		{
			await identityContext.Database.MigrateAsync();
		}

		// Apply migrations for Logging bounded context
		DbContextOptions<LoggingDbContext> loggingOptions = new DbContextOptionsBuilder<LoggingDbContext>()
			.UseNpgsql(ConnectionString)
			.Options;
		await using (LoggingDbContext loggingContext = new(loggingOptions))
		{
			await loggingContext.Database.MigrateAsync();
		}

		// Apply migrations for ApiTracking bounded context
		DbContextOptions<ApiTrackingDbContext> apiTrackingOptions = new DbContextOptionsBuilder<ApiTrackingDbContext>()
			.UseNpgsql(ConnectionString)
			.Options;
		await using (ApiTrackingDbContext apiTrackingContext = new(apiTrackingOptions))
		{
			await apiTrackingContext.Database.MigrateAsync();
		}
	}

	/// <summary>
	/// Stops and disposes the PostgreSQL container.
	/// The database will be automatically cleaned up with the container.
	/// Called once after all tests in the test class complete.
	/// </summary>
	/// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
	public override async Task DisposeAsync() => await PostgreSqlContainer.DisposeAsync();
}