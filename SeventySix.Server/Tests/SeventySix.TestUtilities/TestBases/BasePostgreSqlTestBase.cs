// <copyright file="BasePostgreSqlTestBase.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SeventySix.Identity;
using SeventySix.Logging;
using SeventySix.ApiTracking;
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
	/// Creates a new IdentityDbContext configured for the shared test database.
	/// </summary>
	/// <returns>A configured IdentityDbContext instance.</returns>
	protected IdentityDbContext CreateIdentityDbContext()
	{
		DbContextOptions<IdentityDbContext> options = new DbContextOptionsBuilder<IdentityDbContext>()
			.UseNpgsql(ConnectionString)
			.Options;
		return new IdentityDbContext(options);
	}

	/// <summary>
	/// Creates a new LoggingDbContext configured for the shared test database.
	/// </summary>
	/// <returns>A configured LoggingDbContext instance.</returns>
	protected LoggingDbContext CreateLoggingDbContext()
	{
		DbContextOptions<LoggingDbContext> options = new DbContextOptionsBuilder<LoggingDbContext>()
			.UseNpgsql(ConnectionString)
			.Options;
		return new LoggingDbContext(options);
	}

	/// <summary>
	/// Creates a new ApiTrackingDbContext configured for the shared test database.
	/// </summary>
	/// <returns>A configured ApiTrackingDbContext instance.</returns>
	protected ApiTrackingDbContext CreateApiTrackingDbContext()
	{
		DbContextOptions<ApiTrackingDbContext> options = new DbContextOptionsBuilder<ApiTrackingDbContext>()
			.UseNpgsql(ConnectionString)
			.Options;
		return new ApiTrackingDbContext(options);
	}

	/// <summary>
	/// Creates a service scope with all bounded context DbContexts configured.
	/// Useful for testing services that depend on DbContext.
	/// </summary>
	/// <returns>A service scope with all DbContexts registered.</returns>
	protected IServiceScope CreateServiceScope()
	{
		ServiceCollection services = new();
		services.AddDbContext<IdentityDbContext>(options =>
			options.UseNpgsql(ConnectionString));
		services.AddDbContext<LoggingDbContext>(options =>
			options.UseNpgsql(ConnectionString));
		services.AddDbContext<ApiTrackingDbContext>(options =>
			options.UseNpgsql(ConnectionString));

		ServiceProvider serviceProvider = services.BuildServiceProvider();
		return serviceProvider.CreateScope();
	}

	/// <summary>
	/// Truncates specified tables in the database to ensure test isolation.
	/// Supports tables from all bounded contexts.
	/// Silently skips tables that don't exist yet (before migrations run).
	/// </summary>
	/// <param name="tables">The table names to truncate (with schema prefix if needed, e.g., "identity.Users").</param>
	/// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
	protected virtual async Task TruncateTablesAsync(params string[] tables)
	{
		// Use Identity context for truncation commands (any context will work)
		await using IdentityDbContext context = CreateIdentityDbContext();

		foreach (string table in tables)
		{
			try
			{
#pragma warning disable EF1002 // Risk of SQL injection - table names are hardcoded in test code
				await context.Database.ExecuteSqlRawAsync($"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE");
#pragma warning restore EF1002
			}
			catch (Npgsql.PostgresException ex) when (ex.SqlState == "42P01" || ex.SqlState == "3F000")
			{
				// 42P01: undefined_table - table doesn't exist yet
				// 3F000: invalid_schema_name - schema doesn't exist yet
				// This is expected during first test run before migrations complete
				// Silently continue to next table
			}
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