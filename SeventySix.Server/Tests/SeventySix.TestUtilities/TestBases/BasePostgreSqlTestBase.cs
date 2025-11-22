// <copyright file="BasePostgreSqlTestBase.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SeventySix.Data;
using Xunit;

namespace SeventySix.TestUtilities.TestBases;

/// <summary>
/// Abstract base class for PostgreSQL database tests.
/// Provides common database operations for both API and Data layer tests.
/// </summary>
public abstract class BasePostgreSqlTestBase : IAsyncLifetime
{
	/// <summary>
	/// Gets the connection string for the shared test database.
	/// </summary>
	protected abstract string ConnectionString
	{
		get;
	}

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
	/// Truncates specified tables in the database to ensure test isolation.
	/// </summary>
	/// <param name="tables">The table names to truncate.</param>
	/// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
	protected virtual async Task TruncateTablesAsync(params string[] tables)
	{
		await using ApplicationDbContext context = CreateDbContext();

		foreach (string table in tables)
		{
#pragma warning disable EF1002 // Risk of SQL injection - table names are hardcoded in test code
			await context.Database.ExecuteSqlRawAsync($"TRUNCATE TABLE \"{table}\" RESTART IDENTITY CASCADE");
#pragma warning restore EF1002
		}
	}

	/// <summary>
	/// Called before each test. Subclasses override to define which tables to truncate.
	/// </summary>
	/// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
	public abstract Task InitializeAsync();

	/// <summary>
	/// Called after each test. Cleanup is handled by InitializeAsync of the next test.
	/// </summary>
	/// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
	public virtual Task DisposeAsync() =>
		// No per-test cleanup needed - InitializeAsync handles it
		Task.CompletedTask;
}