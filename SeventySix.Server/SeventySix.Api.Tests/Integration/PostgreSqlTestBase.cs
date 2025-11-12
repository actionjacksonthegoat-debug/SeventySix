// <copyright file="PostgreSqlTestBase.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using SeventySix.Data;
using Xunit;

namespace SeventySix.Api.Tests.Integration;

/// <summary>
/// Shared PostgreSQL fixture that connects to localhost PostgreSQL for all API integration tests.
/// Uses local PostgreSQL instance for faster test execution compared to Testcontainers.
/// This matches production behavior where all services connect to the same database.
/// </summary>
public sealed class PostgreSqlFixture : IAsyncLifetime
{
	private const string LOCALCONNECTIONSTRING = "Host=localhost;Port=5432;Database=seventysix_test;Username=postgres;Password=TestPassword;Pooling=true;Include Error Detail=true";

	/// <summary>
	/// Gets the connection string for the shared test database.
	/// </summary>
	public string ConnectionString => LOCALCONNECTIONSTRING;

	/// <summary>
	/// Initializes the test database and applies migrations.
	/// Called once before all tests in the collection.
	/// </summary>
	/// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
	public async Task InitializeAsync()
	{
		// Apply migrations to create database schema
		var options = new DbContextOptionsBuilder<ApplicationDbContext>()
			.UseNpgsql(ConnectionString)
			.Options;

		await using var context = new ApplicationDbContext(options);

		// Ensure database exists and is up to date
		await context.Database.MigrateAsync();
	}

	/// <summary>
	/// Cleanup after all tests complete.
	/// </summary>
	/// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
	public Task DisposeAsync()
	{
		// Database remains for next test run - cleaned before each test
		return Task.CompletedTask;
	}
}

/// <summary>
/// Base class for API integration tests that require a shared PostgreSQL database and WebApplicationFactory.
/// Uses IClassFixture to share a single PostgreSQL instance across all tests in the class.
/// </summary>
public abstract class PostgreSqlTestBase : IAsyncLifetime
{
	private readonly PostgreSqlFixture Fixture;

	/// <summary>
	/// Initializes a new instance of the <see cref="PostgreSqlTestBase"/> class.
	/// </summary>
	/// <param name="fixture">The shared PostgreSQL fixture.</param>
	protected PostgreSqlTestBase(PostgreSqlFixture fixture)
	{
		Fixture = fixture;
	}

	/// <summary>
	/// Gets the connection string for the shared test database.
	/// </summary>
	protected string ConnectionString => Fixture.ConnectionString;

	/// <summary>
	/// Creates a WebApplicationFactory configured to use the test PostgreSQL database.
	/// </summary>
	/// <returns>A configured WebApplicationFactory instance.</returns>
	protected WebApplicationFactory<Program> CreateWebApplicationFactory()
	{
		return new WebApplicationFactory<Program>()
			.WithWebHostBuilder(builder =>
			{
				builder.ConfigureServices(services =>
				{
					// Remove the existing DbContext registration
					services.RemoveAll<DbContextOptions<ApplicationDbContext>>();
					services.RemoveAll<ApplicationDbContext>();

					// Add DbContext with test database connection string
					services.AddDbContext<ApplicationDbContext>(options =>
						options.UseNpgsql(ConnectionString));
				});
			});
	}

	/// <summary>
	/// Called before each test. Clears all data from the database to ensure test isolation.
	/// </summary>
	/// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
	public async Task InitializeAsync()
	{
		// Clean up data before each test to ensure isolation
		var options = new DbContextOptionsBuilder<ApplicationDbContext>()
			.UseNpgsql(ConnectionString)
			.Options;

		await using var context = new ApplicationDbContext(options);
		await context.Database.ExecuteSqlRawAsync(
			"TRUNCATE TABLE \"ThirdPartyApiRequests\" RESTART IDENTITY CASCADE");
	}

	/// <summary>
	/// Called after each test. Cleanup is handled by InitializeAsync of the next test.
	/// </summary>
	/// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
	public Task DisposeAsync()
	{
		// No per-test cleanup needed - InitializeAsync handles it
		return Task.CompletedTask;
	}
}
