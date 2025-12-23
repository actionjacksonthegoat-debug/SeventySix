// <copyright file="TestcontainersPostgreSqlFixture.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Concurrent;

namespace SeventySix.TestUtilities.TestBases;

/// <summary>
/// PostgreSQL fixture that uses SharedContainerManager for test database access.
/// All fixtures share a single PostgreSQL container, with isolated databases per fixture.
/// Each test class gets its own isolated database to enable parallel test execution.
/// Also caches SharedWebApplicationFactory instances to avoid repeated factory creation overhead.
/// </summary>
public sealed class TestcontainersPostgreSqlFixture : BasePostgreSqlFixture
{
	private readonly string DatabaseName;
	private readonly ConcurrentDictionary<Type, object> CachedFactories = new();
	private string? ConnectionStringValue;

	/// <summary>
	/// Initializes a new instance of the <see cref="TestcontainersPostgreSqlFixture"/> class.
	/// </summary>
	public TestcontainersPostgreSqlFixture()
	{
		// Generate unique database name per test class instance
		DatabaseName =
			$"test_{Guid.NewGuid():N}";
	}

	/// <summary>
	/// Gets the connection string for the isolated test database.
	/// </summary>
	public override string ConnectionString =>
		ConnectionStringValue
		?? throw new InvalidOperationException(
			"Fixture not initialized. Call InitializeAsync first.");

	/// <summary>
	/// Gets or creates a cached SharedWebApplicationFactory for the specified program type.
	/// Reusing the factory across tests significantly reduces test execution time.
	/// </summary>
	/// <typeparam name="TProgram">The entry point type for the application.</typeparam>
	/// <returns>
	/// A cached or newly created SharedWebApplicationFactory instance.
	/// </returns>
	public override SharedWebApplicationFactory<TProgram> GetOrCreateFactory<TProgram>()
	{
		return (SharedWebApplicationFactory<TProgram>)
			CachedFactories.GetOrAdd(
				typeof(TProgram),
				_ => new SharedWebApplicationFactory<TProgram>(ConnectionString));
	}

	/// <summary>
	/// Creates an isolated database using SharedContainerManager and applies migrations.
	/// Uses SharedContainerManager to ensure only one container across all test assemblies.
	/// </summary>
	/// <returns>
	/// A <see cref="Task"/> representing the asynchronous operation.
	/// </returns>
	public override async Task InitializeAsync()
	{
		ConnectionStringValue =
			await SharedContainerManager.CreateDatabaseAsync(DatabaseName);
	}

	/// <summary>
	/// Disposes cached factories. Container cleanup handled by SharedContainerManager.
	/// </summary>
	/// <returns>
	/// A <see cref="Task"/> representing the asynchronous operation.
	/// </returns>
	public override async Task DisposeAsync()
	{
		// Dispose all cached WebApplicationFactory instances
		foreach (object factory in CachedFactories.Values)
		{
			if (factory is IDisposable disposable)
			{
				disposable.Dispose();
			}
		}

		CachedFactories.Clear();

		// Note: Don't dispose SharedContainerManager here - other fixtures may still use it
		await Task.CompletedTask;
	}
}