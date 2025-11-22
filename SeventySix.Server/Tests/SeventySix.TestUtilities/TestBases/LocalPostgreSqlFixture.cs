// <copyright file="LocalPostgreSqlFixture.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using SeventySix.Data;

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
		// Apply migrations to create database schema
		DbContextOptions<ApplicationDbContext> options = new DbContextOptionsBuilder<ApplicationDbContext>()
			.UseNpgsql(ConnectionString)
			.Options;

		await using ApplicationDbContext context = new(options);

		// Ensure database exists and is up to date
		await context.Database.MigrateAsync();
	}

	/// <summary>
	/// Cleanup after all tests complete.
	/// </summary>
	/// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
	public override Task DisposeAsync() =>
		// Database remains for next test run - cleaned before each test
		Task.CompletedTask;
}