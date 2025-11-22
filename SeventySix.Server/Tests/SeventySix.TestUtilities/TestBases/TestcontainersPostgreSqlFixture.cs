// <copyright file="TestcontainersPostgreSqlFixture.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using SeventySix.Data;
using Testcontainers.PostgreSql;

namespace SeventySix.TestUtilities.TestBases;

/// <summary>
/// PostgreSQL fixture that creates a Testcontainers database instance for Data layer tests.
/// Uses Testcontainers for isolated, reproducible testing without external dependencies.
/// This provides a clean database for each test run.
/// </summary>
public sealed class TestcontainersPostgreSqlFixture : BasePostgreSqlFixture
{
	private readonly PostgreSqlContainer PostgreSqlContainer;

	/// <summary>
	/// Initializes a new instance of the <see cref="TestcontainersPostgreSqlFixture"/> class.
	/// </summary>
	public TestcontainersPostgreSqlFixture()
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
	public override string ConnectionString => PostgreSqlContainer.GetConnectionString();

	/// <summary>
	/// Starts the PostgreSQL container and applies migrations.
	/// Called once before all tests in the collection.
	/// </summary>
	/// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
	public override async Task InitializeAsync()
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
	public override async Task DisposeAsync() => await PostgreSqlContainer.DisposeAsync();
}