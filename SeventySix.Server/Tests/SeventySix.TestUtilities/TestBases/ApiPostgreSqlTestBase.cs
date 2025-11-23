// <copyright file="ApiPostgreSqlTestBase.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using SeventySix.Data;

namespace SeventySix.TestUtilities.TestBases;

/// <summary>
/// Base class for API tests that require a shared PostgreSQL database and WebApplicationFactory.
/// Uses LocalPostgreSqlFixture for localhost PostgreSQL connection.
///
/// IMPORTANT: This is NOT an integration test base class.
/// Tests using this base class should mock all external dependencies.
/// Only integration tests should call real third-party APIs.
/// </summary>
/// <typeparam name="TProgram">The entry point type for the application.</typeparam>
public abstract class ApiPostgreSqlTestBase<TProgram> : BasePostgreSqlTestBase
	where TProgram : class
{
	private readonly LocalPostgreSqlFixture Fixture;

	/// <summary>
	/// Initializes a new instance of the <see cref="ApiPostgreSqlTestBase{TProgram}"/> class.
	/// </summary>
	/// <param name="fixture">The shared PostgreSQL fixture.</param>
	protected ApiPostgreSqlTestBase(LocalPostgreSqlFixture fixture)
	{
		Fixture = fixture;
	}

	/// <summary>
	/// Gets the connection string for the shared test database.
	/// </summary>
	protected override string ConnectionString => Fixture.ConnectionString;

	/// <summary>
	/// Creates a WebApplicationFactory configured to use the test PostgreSQL database.
	/// </summary>
	/// <returns>A configured WebApplicationFactory instance.</returns>
	protected WebApplicationFactory<TProgram> CreateWebApplicationFactory()
	{
		return new WebApplicationFactory<TProgram>()
			.WithWebHostBuilder(builder =>
			{
				builder.ConfigureServices(services =>
				{
					// Remove the existing DbContext registration
					services.RemoveAll<DbContextOptions<ApplicationDbContext>>();
					services.RemoveAll<ApplicationDbContext>();

					// Add DbContext with test database connection string
					services.AddDbContext<ApplicationDbContext>(options =>
						options.UseNpgsql(ConnectionString));
				});
			});
	}

	/// <summary>
	/// Called before each test. Clears all data from the database to ensure test isolation.
	/// </summary>
	/// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
	public override async Task InitializeAsync()
	{
		// Clean up data before each test to ensure isolation
		await TruncateTablesAsync("ThirdPartyApiRequests");
	}
}