// <copyright file="PostgreSqlTestBase.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SeventySix.Data;
using Testcontainers.PostgreSql;

namespace SeventySix.DataAccess.Tests.Integration;

/// <summary>
/// Shared PostgreSQL fixture that creates a single database instance for DataAccess layer tests.
/// Uses Testcontainers for isolated, reproducible testing without external dependencies.
/// This provides a clean database for each test run.
/// </summary>
public sealed class PostgreSqlFixture : IAsyncLifetime
{
	private readonly PostgreSqlContainer PostgreSqlContainer;

	/// <summary>
	/// Initializes a new instance of the <see cref="PostgreSqlFixture"/> class.
	/// </summary>
	public PostgreSqlFixture()
	{
		PostgreSqlContainer = new PostgreSqlBuilder()
			.WithImage("postgres:16-alpine")
			.WithDatabase("seventysix_test")
			.WithUsername("postgres")
			.WithPassword("test_password")
			.WithCleanUp(true)
			.Build();
	}

	/// <summary>
	/// Gets the connection string for the shared test database.
	/// </summary>
	public string ConnectionString => PostgreSqlContainer.GetConnectionString();

	/// <summary>
	/// Starts the PostgreSQL container and applies migrations.
	/// Called once before all tests in the collection.
	/// </summary>
	/// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
	public async Task InitializeAsync()
	{
		await PostgreSqlContainer.StartAsync();

		// Apply migrations to create database schema
		DbContextOptions<ApplicationDbContext> options = new DbContextOptionsBuilder<ApplicationDbContext>()
			.UseNpgsql(ConnectionString)
			.Options;

		await using ApplicationDbContext context = new(options);
		await context.Database.MigrateAsync();
	}

	/// <summary>
	/// Stops and disposes the PostgreSQL container.
	/// Called once after all tests in the collection complete.
	/// </summary>
	/// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
	public async Task DisposeAsync() => await PostgreSqlContainer.DisposeAsync();
}

/// <summary>
/// Base class for integration tests that require a shared PostgreSQL database.
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
	/// Creates a new DbContext configured for the shared test database.
	/// Each call creates a new context instance, simulating production where
	/// each request gets its own scoped DbContext.
	/// </summary>
	/// <returns>A configured ApplicationDbContext instance.</returns>
	protected ApplicationDbContext CreateDbContext()
	{
		DbContextOptions<ApplicationDbContext> options = new DbContextOptionsBuilder<ApplicationDbContext>()
			.UseNpgsql(ConnectionString)
			.Options;

		return new ApplicationDbContext(options);
	}

	/// <summary>
	/// Creates a service scope with the shared test database configured.
	/// Useful for testing services that depend on DbContext.
	/// </summary>
	/// <returns>A service scope with ApplicationDbContext registered.</returns>
	protected IServiceScope CreateServiceScope()
	{
		ServiceCollection services = new();
		services.AddDbContext<ApplicationDbContext>(options =>
			options.UseNpgsql(ConnectionString));

		ServiceProvider serviceProvider = services.BuildServiceProvider();
		return serviceProvider.CreateScope();
	}

	/// <summary>
	/// Called before each test. Clears all data from the database to ensure test isolation.
	/// </summary>
	/// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
	public async Task InitializeAsync()
	{
		// Clean up data before each test to ensure isolation
		await using ApplicationDbContext context = CreateDbContext();
		await context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"ThirdPartyApiRequests\" RESTART IDENTITY CASCADE");
	}

	/// <summary>
	/// Called after each test. Cleanup is handled by InitializeAsync of the next test.
	/// </summary>
	/// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
	public Task DisposeAsync() =>
		// No per-test cleanup needed - InitializeAsync handles it
		Task.CompletedTask;
}