// <copyright file="LocalPostgreSqlFixture.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using SeventySix.Identity;
using SeventySix.Logging;
using SeventySix.ApiTracking;

namespace SeventySix.TestUtilities.TestBases;

/// <summary>
/// PostgreSQL fixture that connects to localhost PostgreSQL for API tests.
/// Uses local PostgreSQL instance for faster test execution compared to Testcontainers.
/// This matches production behavior where all services connect to the same database.
/// </summary>
public sealed class LocalPostgreSqlFixture : BasePostgreSqlFixture
{
	private const string LOCALCONNECTIONSTRING = "Host=localhost;Port=5432;Database=seventysix_test;Username=postgres;Password=TestPassword;Pooling=true;Include Error Detail=true";

	/// <summary>
	/// Gets the connection string for the shared test database.
	/// </summary>
	public override string ConnectionString => LOCALCONNECTIONSTRING;

	/// <summary>
	/// Initializes the test database and applies migrations.
	/// Called once before all tests in the collection.
	/// </summary>
	/// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
	public override async Task InitializeAsync()
	{
		// Ensure database exists and apply migrations
		DbContextOptions<IdentityDbContext> identityOptions = new DbContextOptionsBuilder<IdentityDbContext>()
			.UseNpgsql(ConnectionString)
			.Options;
		await using (IdentityDbContext identityContext = new(identityOptions))
		{
			// Ensure database exists and apply migrations for Identity
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
	/// Cleanup after all tests complete.
	/// </summary>
	/// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
	public override Task DisposeAsync() =>
		// Database remains for next test run - cleaned before each test
		Task.CompletedTask;
}