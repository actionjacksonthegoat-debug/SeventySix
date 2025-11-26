// <copyright file="RepositoryTestHelper.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using SeventySix.Identity;
using SeventySix.Logging;
using SeventySix.ApiTracking;

namespace SeventySix.TestUtilities.TestHelpers;

/// <summary>
/// Helper methods for creating repository instances in tests.
/// </summary>
/// <remarks>
/// Provides convenient methods to create repository instances with mocked dependencies.
/// Reduces boilerplate code when setting up repository tests.
///
/// Usage:
/// <code>
/// IdentityDbContext context = CreateIdentityContext();
/// UserRepository repository = RepositoryTestHelper.CreateRepository&lt;UserRepository&gt;(context);
/// </code>
///
/// Design Patterns:
/// - Factory Pattern: Creates repository instances
/// - Test Helper: Simplifies test setup
/// </remarks>
public static class RepositoryTestHelper
{
	/// <summary>
	/// Creates a repository instance with a mocked logger.
	/// </summary>
	/// <typeparam name="TRepository">The repository type to create.</typeparam>
	/// <typeparam name="TContext">The DbContext type.</typeparam>
	/// <param name="context">The database context.</param>
	/// <returns>A new repository instance.</returns>
	/// <remarks>
	/// This method uses reflection to create repository instances with:
	/// - The provided DbContext
	/// - A mocked ILogger&lt;TRepository&gt;
	///
	/// Assumes the repository constructor follows the pattern:
	/// public TRepository(TContext context, ILogger&lt;TRepository&gt; logger)
	/// </remarks>
	public static TRepository CreateRepository<TRepository, TContext>(TContext context)
		where TRepository : class
		where TContext : DbContext
	{
		ILogger<TRepository> mockLogger = Mock.Of<ILogger<TRepository>>();

		TRepository? repository = (TRepository?)Activator.CreateInstance(
			typeof(TRepository),
			context,
			mockLogger);

		return repository ?? throw new InvalidOperationException(
			$"Failed to create instance of {typeof(TRepository).Name}. " +
			$"Ensure the repository has a constructor with parameters ({typeof(TContext).Name}, ILogger<{typeof(TRepository).Name}>).");
	}

	/// <summary>
	/// Creates an in-memory Identity database context for testing.
	/// </summary>
	/// <param name="databaseName">The name of the in-memory database (default: random GUID).</param>
	/// <returns>A new IdentityDbContext configured for in-memory testing.</returns>
	public static IdentityDbContext CreateInMemoryIdentityContext(string? databaseName = null)
	{
		string dbName = databaseName ?? Guid.NewGuid().ToString();
		DbContextOptions<IdentityDbContext> options = new DbContextOptionsBuilder<IdentityDbContext>()
			.UseInMemoryDatabase(databaseName: dbName)
			.Options;
		return new IdentityDbContext(options);
	}

	/// <summary>
	/// Creates an in-memory Logging database context for testing.
	/// </summary>
	/// <param name="databaseName">The name of the in-memory database (default: random GUID).</param>
	/// <returns>A new LoggingDbContext configured for in-memory testing.</returns>
	public static LoggingDbContext CreateInMemoryLoggingContext(string? databaseName = null)
	{
		string dbName = databaseName ?? Guid.NewGuid().ToString();
		DbContextOptions<LoggingDbContext> options = new DbContextOptionsBuilder<LoggingDbContext>()
			.UseInMemoryDatabase(databaseName: dbName)
			.Options;
		return new LoggingDbContext(options);
	}

	/// <summary>
	/// Creates an in-memory ApiTracking database context for testing.
	/// </summary>
	/// <param name="databaseName">The name of the in-memory database (default: random GUID).</param>
	/// <returns>A new ApiTrackingDbContext configured for in-memory testing.</returns>
	public static ApiTrackingDbContext CreateInMemoryApiTrackingContext(string? databaseName = null)
	{
		string dbName = databaseName ?? Guid.NewGuid().ToString();
		DbContextOptions<ApiTrackingDbContext> options = new DbContextOptionsBuilder<ApiTrackingDbContext>()
			.UseInMemoryDatabase(databaseName: dbName)
			.Options;
		return new ApiTrackingDbContext(options);
	}

	/// <summary>
	/// Creates a SQLite in-memory Identity database context for testing.
	/// </summary>
	/// <returns>A new IdentityDbContext configured for SQLite in-memory testing.</returns>
	/// <remarks>
	/// IMPORTANT: Call connection.Open() before using the context and connection.Close()
	/// after disposing the context to maintain the in-memory database.
	/// </remarks>
	public static (IdentityDbContext context, SqliteConnection connection) CreateSqliteInMemoryIdentityContext()
	{
		SqliteConnection connection = new("DataSource=:memory:");
		connection.Open();
		DbContextOptions<IdentityDbContext> options = new DbContextOptionsBuilder<IdentityDbContext>()
			.UseSqlite(connection)
			.Options;
		IdentityDbContext context = new(options);
		context.Database.EnsureCreated();
		return (context, connection);
	}

	/// <summary>
	/// Creates a SQLite in-memory Logging database context for testing.
	/// </summary>
	/// <returns>A new LoggingDbContext configured for SQLite in-memory testing.</returns>
	public static (LoggingDbContext context, SqliteConnection connection) CreateSqliteInMemoryLoggingContext()
	{
		SqliteConnection connection = new("DataSource=:memory:");
		connection.Open();
		DbContextOptions<LoggingDbContext> options = new DbContextOptionsBuilder<LoggingDbContext>()
			.UseSqlite(connection)
			.Options;
		LoggingDbContext context = new(options);
		context.Database.EnsureCreated();
		return (context, connection);
	}

	/// <summary>
	/// Creates a SQLite in-memory ApiTracking database context for testing.
	/// </summary>
	/// <returns>A new ApiTrackingDbContext configured for SQLite in-memory testing.</returns>
	public static (ApiTrackingDbContext context, SqliteConnection connection) CreateSqliteInMemoryApiTrackingContext()
	{
		SqliteConnection connection = new("DataSource=:memory:");
		connection.Open();
		DbContextOptions<ApiTrackingDbContext> options = new DbContextOptionsBuilder<ApiTrackingDbContext>()
			.UseSqlite(connection)
			.Options;
		ApiTrackingDbContext context = new(options);
		context.Database.EnsureCreated();
		return (context, connection);
	}
}