// <copyright file="RepositoryTestHelper.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using SeventySix.Data;

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
/// ApplicationDbContext context = CreateDbContext();
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
	/// <param name="context">The database context.</param>
	/// <returns>A new repository instance.</returns>
	/// <remarks>
	/// This method uses reflection to create repository instances with:
	/// - The provided ApplicationDbContext
	/// - A mocked ILogger&lt;TRepository&gt;
	///
	/// Assumes the repository constructor follows the pattern:
	/// public TRepository(ApplicationDbContext context, ILogger&lt;TRepository&gt; logger)
	/// </remarks>
	public static TRepository CreateRepository<TRepository>(ApplicationDbContext context)
		where TRepository : class
	{
		ILogger<TRepository> mockLogger = Mock.Of<ILogger<TRepository>>();

		TRepository? repository = (TRepository?)Activator.CreateInstance(
			typeof(TRepository),
			context,
			mockLogger);

		return repository ?? throw new InvalidOperationException(
			$"Failed to create instance of {typeof(TRepository).Name}. " +
			$"Ensure the repository has a constructor with parameters (ApplicationDbContext, ILogger<{typeof(TRepository).Name}>).");
	}

	/// <summary>
	/// Creates an in-memory database context for testing.
	/// </summary>
	/// <param name="databaseName">The name of the in-memory database (default: random GUID).</param>
	/// <returns>A new ApplicationDbContext configured for in-memory testing.</returns>
	/// <remarks>
	/// Creates a SQLite in-memory database context suitable for unit tests.
	/// Each unique database name creates an isolated database instance.
	/// Use a unique name per test to ensure test isolation.
	/// </remarks>
	public static ApplicationDbContext CreateInMemoryContext(string? databaseName = null)
	{
		string dbName = databaseName ?? Guid.NewGuid().ToString();

		DbContextOptions<ApplicationDbContext> options = new DbContextOptionsBuilder<ApplicationDbContext>()
			.UseInMemoryDatabase(databaseName: dbName)
			.Options;

		return new ApplicationDbContext(options);
	}

	/// <summary>
	/// Creates a SQLite in-memory database context for testing.
	/// </summary>
	/// <returns>A new ApplicationDbContext configured for SQLite in-memory testing.</returns>
	/// <remarks>
	/// Creates a SQLite in-memory database context that behaves more like a real database
	/// than EF Core's InMemory provider. Useful for testing database-specific features.
	///
	/// IMPORTANT: Call connection.Open() before using the context and connection.Close()
	/// after disposing the context to maintain the in-memory database.
	/// </remarks>
	public static (ApplicationDbContext context, SqliteConnection connection) CreateSqliteInMemoryContext()
	{
		SqliteConnection connection = new("DataSource=:memory:");
		connection.Open();

		DbContextOptions<ApplicationDbContext> options = new DbContextOptionsBuilder<ApplicationDbContext>()
			.UseSqlite(connection)
			.Options;

		ApplicationDbContext context = new(options);
		context.Database.EnsureCreated();

		return (context, connection);
	}
}