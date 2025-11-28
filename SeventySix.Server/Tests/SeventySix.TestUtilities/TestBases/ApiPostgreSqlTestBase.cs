// <copyright file="ApiPostgreSqlTestBase.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using SeventySix.ApiTracking;
using SeventySix.Identity;
using SeventySix.Logging;

namespace SeventySix.TestUtilities.TestBases;

/// <summary>
/// Base class for API tests that require a shared PostgreSQL database and WebApplicationFactory.
/// Uses BasePostgreSqlFixture for flexible PostgreSQL connection (Testcontainers or localhost).
///
/// IMPORTANT: This is NOT an integration test base class.
/// Tests using this base class should mock all external dependencies.
/// Only integration tests should call real third-party APIs.
/// </summary>
/// <typeparam name="TProgram">The entry point type for the application.</typeparam>
public abstract class ApiPostgreSqlTestBase<TProgram> : BasePostgreSqlTestBase
	where TProgram : class
{
	private readonly BasePostgreSqlFixture Fixture;

	/// <summary>
	/// Initializes a new instance of the <see cref="ApiPostgreSqlTestBase{TProgram}"/> class.
	/// </summary>
	/// <param name="fixture">The shared PostgreSQL fixture.</param>
	protected ApiPostgreSqlTestBase(BasePostgreSqlFixture fixture)
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
					// Remove existing DbContext registrations
					services.RemoveAll<DbContextOptions<IdentityDbContext>>();
					services.RemoveAll<IdentityDbContext>();
					services.RemoveAll<DbContextOptions<LoggingDbContext>>();
					services.RemoveAll<LoggingDbContext>();
					services.RemoveAll<DbContextOptions<ApiTrackingDbContext>>();
					services.RemoveAll<ApiTrackingDbContext>();

					// Add DbContexts with test database connection string
					services.AddDbContext<IdentityDbContext>(options =>
						options.UseNpgsql(ConnectionString));
					services.AddDbContext<LoggingDbContext>(options =>
						options.UseNpgsql(ConnectionString));
					services.AddDbContext<ApiTrackingDbContext>(options =>
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
		// PostgreSQL identifiers are case-insensitive unless quoted, migrations create lowercase names
		await TruncateTablesAsync(
			"\"ApiTracking\".\"ThirdPartyApiRequests\"",
			"\"Identity\".\"Users\"",
			"\"Logging\".\"Logs\"");
	}
}