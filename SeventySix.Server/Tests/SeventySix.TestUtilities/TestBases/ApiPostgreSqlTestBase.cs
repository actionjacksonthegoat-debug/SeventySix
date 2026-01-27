// <copyright file="ApiPostgreSqlTestBase.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using SeventySix.TestUtilities.Constants;

namespace SeventySix.TestUtilities.TestBases;

/// <summary>
/// Base class for API tests that require a shared PostgreSQL database and WebApplicationFactory.
/// Uses BasePostgreSqlFixture for flexible PostgreSQL connection (Testcontainers or localhost).
///
/// IMPORTANT: This is NOT an integration test base class.
/// Tests using this base class should mock all external dependencies.
/// Only integration tests should call real third-party APIs.
///
/// PERFORMANCE: Uses a shared WebApplicationFactory from the fixture to avoid repeated
/// factory creation overhead. The factory is created once per collection and reused.
/// </summary>
/// <typeparam name="TProgram">The entry point type for the application.</typeparam>
public abstract class ApiPostgreSqlTestBase<TProgram> : BasePostgreSqlTestBase
	where TProgram : class
{
	private readonly BasePostgreSqlFixture Fixture;

	/// <summary>
	/// Initializes a new instance of the <see cref="ApiPostgreSqlTestBase{TProgram}"/> class.
	/// </summary>
	/// <param name="fixture">
	/// The shared PostgreSQL fixture.
	/// </param>
	protected ApiPostgreSqlTestBase(BasePostgreSqlFixture fixture)
	{
		Fixture = fixture;
	}

	/// <summary>
	/// Gets the connection string for the shared test database.
	/// </summary>
	protected override string ConnectionString => Fixture.ConnectionString;

	/// <summary>
	/// Gets the shared WebApplicationFactory from the fixture.
	/// This factory is cached and reused across all tests in the collection,
	/// significantly reducing test execution time.
	/// </summary>
	protected SharedWebApplicationFactory<TProgram> SharedFactory =>
		Fixture.GetOrCreateFactory<TProgram>();

	/// <summary>
	/// Creates an HttpClient from the shared WebApplicationFactory.
	/// Use this for most tests instead of creating a new factory.
	/// </summary>
	/// <returns>
	/// An HttpClient configured to use the shared test server.
	/// </returns>
	protected HttpClient CreateClient() => SharedFactory.CreateClient();

	/// <summary>
	/// Creates an HttpClient from the shared WebApplicationFactory with custom options.
	/// </summary>
	/// <param name="options">
	/// Options for configuring the HttpClient.
	/// </param>
	/// <returns>
	/// An HttpClient configured to use the shared test server.
	/// </returns>
	protected HttpClient CreateClient(
		WebApplicationFactoryClientOptions options) => SharedFactory.CreateClient(options);

	/// <summary>
	/// Creates a new isolated WebApplicationFactory that is NOT shared.
	/// Use this for tests that require isolated in-memory state, such as rate limiting tests.
	/// The caller is responsible for disposing the returned factory.
	/// </summary>
	/// <returns>
	/// A new WebApplicationFactory instance.
	/// </returns>
	protected SharedWebApplicationFactory<TProgram> CreateIsolatedFactory() =>
		new(ConnectionString);

	/// <summary>
	/// Creates a new isolated WebApplicationFactory with additional configuration.
	/// Use this for tests that require isolated in-memory state with custom configuration.
	/// The caller is responsible for disposing the returned factory.
	/// </summary>
	/// <param name="configureAdditional">
	/// Additional web host builder configuration.
	/// </param>
	/// <returns>
	/// A new WebApplicationFactory instance.
	/// </returns>
	protected SharedWebApplicationFactory<TProgram> CreateIsolatedFactory(
		Action<IWebHostBuilder> configureAdditional) => new(ConnectionString, configureAdditional);

	/// <summary>
	/// Creates a new isolated WebApplicationFactory with host and service configuration.
	/// Use for tests requiring isolated state with custom service mocking.
	/// The caller is responsible for disposing the returned factory.
	/// </summary>
	/// <param name="configureWebHost">
	/// Web host builder configuration (e.g., configuration values).
	/// </param>
	/// <param name="configureServices">
	/// Service collection configuration (e.g., mock service registration).
	/// </param>
	/// <returns>
	/// A new WebApplicationFactory instance.
	/// </returns>
	protected SharedWebApplicationFactory<TProgram> CreateIsolatedFactory(
		Action<IWebHostBuilder> configureWebHost,
		Action<IServiceCollection> configureServices) =>
			new(
				ConnectionString,
				configureWebHost,
				configureServices);

	/// <summary>
	/// Called before each test. Clears all data from the database to ensure test isolation.
	/// </summary>
	/// <returns>
	/// A <see cref="Task"/> representing the asynchronous operation.
	/// </returns>
	public override async Task InitializeAsync()
	{
		// Clean up all tables before each test to ensure isolation
		await TruncateTablesAsync(TestTables.All);
	}
}