// <copyright file="BasePostgreSqlTestBase.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using SeventySix.ApiTracking;
using SeventySix.Identity;
using SeventySix.Logging;
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
	protected abstract string ConnectionString { get; }

	/// <summary>
	/// Creates a new IdentityDbContext configured for the shared test database.
	/// </summary>
	/// <returns>A configured IdentityDbContext instance.</returns>
	protected IdentityDbContext CreateIdentityDbContext()
	{
		DbContextOptions<IdentityDbContext> options =
			new DbContextOptionsBuilder<IdentityDbContext>()
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
		DbContextOptions<LoggingDbContext> options =
			new DbContextOptionsBuilder<LoggingDbContext>()
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
		DbContextOptions<ApiTrackingDbContext> options =
			new DbContextOptionsBuilder<ApiTrackingDbContext>()
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

		ServiceProvider serviceProvider =
			services.BuildServiceProvider();
		return serviceProvider.CreateScope();
	}

	/// <summary>
	/// Truncates specified tables in a single batched statement for better performance.
	/// Uses CASCADE to handle foreign key dependencies automatically.
	/// Silently skips if tables don't exist yet (before migrations run).
	/// </summary>
	/// <param name="tables">The table names to truncate (with schema prefix, e.g., "Identity"."Users").</param>
	/// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
	protected virtual async Task TruncateTablesAsync(params string[] tables)
	{
		if (tables.Length == 0)
		{
			return;
		}

		// Single TRUNCATE with RESTART IDENTITY CASCADE is faster than multiple statements
		// CASCADE handles foreign key dependencies automatically
		string tableList =
			string.Join(", ", tables);
		string sql =
			$"TRUNCATE TABLE {tableList} RESTART IDENTITY CASCADE";

		try
		{
			await using NpgsqlConnection connection =
				new(ConnectionString);
			await connection.OpenAsync();
			await using NpgsqlCommand command =
				new(sql, connection);
			await command.ExecuteNonQueryAsync();
		}
		catch (PostgresException ex) when (ex.SqlState is "42P01" or "3F000")
		{
			// 42P01: undefined_table - table doesn't exist yet
			// 3F000: invalid_schema_name - schema doesn't exist yet
			// This is expected during first test run before migrations complete
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
