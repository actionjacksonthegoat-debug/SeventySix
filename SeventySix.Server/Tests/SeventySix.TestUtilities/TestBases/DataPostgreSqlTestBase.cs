// <copyright file="DataPostgreSqlTestBase.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.TestUtilities.TestBases;

/// <summary>
/// Base class for Data layer tests that require a shared PostgreSQL database.
/// Uses TestcontainersPostgreSqlFixture for isolated Docker-based PostgreSQL.
/// </summary>
public abstract class DataPostgreSqlTestBase : BasePostgreSqlTestBase
{
	private readonly TestcontainersPostgreSqlFixture Fixture;

	/// <summary>
	/// Initializes a new instance of the <see cref="DataPostgreSqlTestBase"/> class.
	/// </summary>
	/// <param name="fixture">The shared PostgreSQL fixture.</param>
	protected DataPostgreSqlTestBase(TestcontainersPostgreSqlFixture fixture)
	{
		Fixture = fixture;
	}

	/// <summary>
	/// Gets the connection string for the shared test database.
	/// </summary>
	protected override string ConnectionString => Fixture.ConnectionString;

	/// <summary>
	/// Called before each test. Clears all data from the database to ensure test isolation.
	/// </summary>
	/// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
	public override async Task InitializeAsync()
	{
		// Clean up data before each test to ensure isolation
		// Truncate all tables in correct order (respecting foreign keys)
		await TruncateTablesAsync("Logs", "ThirdPartyApiRequests", "Users");
	}
}