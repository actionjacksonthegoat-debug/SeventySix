// <copyright file="BasePostgreSqlFixture.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Xunit;

namespace SeventySix.TestUtilities.TestBases;

/// <summary>
/// Abstract base class for PostgreSQL test fixtures.
/// Provides common interface for both localhost and Testcontainers PostgreSQL implementations.
/// </summary>
public abstract class BasePostgreSqlFixture : IAsyncLifetime
{
	/// <summary>
	/// Gets the connection string for the PostgreSQL database.
	/// </summary>
	public abstract string ConnectionString { get; }

	/// <summary>
	/// Gets or creates a cached SharedWebApplicationFactory for the specified program type.
	/// Reusing the factory across tests significantly reduces test execution time.
	/// </summary>
	/// <typeparam name="TProgram">The entry point type for the application.</typeparam>
	/// <returns>
	/// A cached or newly created SharedWebApplicationFactory instance.
	/// </returns>
	public abstract SharedWebApplicationFactory<TProgram> GetOrCreateFactory<TProgram>()
		where TProgram : class;

	/// <summary>
	/// Initializes the PostgreSQL database and applies migrations.
	/// Called once before all tests in the collection.
	/// </summary>
	/// <returns>
	/// A <see cref="Task"/> representing the asynchronous operation.
	/// </returns>
	public abstract Task InitializeAsync();

	/// <summary>
	/// Cleanup after all tests complete.
	/// </summary>
	/// <returns>
	/// A <see cref="Task"/> representing the asynchronous operation.
	/// </returns>
	public abstract Task DisposeAsync();
}