// <copyright file="DataPostgreSqlTestBase.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.TestUtilities.Constants;

namespace SeventySix.TestUtilities.TestBases;

/// <summary>
/// Base class for Data layer tests that require an isolated PostgreSQL database.
/// Uses TestcontainersPostgreSqlFixture for Docker-based PostgreSQL.
/// Each test class gets its own isolated database for complete test isolation.
/// </summary>
public abstract class DataPostgreSqlTestBase : BasePostgreSqlTestBase
{
	private readonly TestcontainersPostgreSqlFixture Fixture;

	/// <summary>
	/// Initializes a new instance of the <see cref="DataPostgreSqlTestBase"/> class.
	/// </summary>
	/// <param name="fixture">The PostgreSQL fixture that provides an isolated database for this test class.</param>
	protected DataPostgreSqlTestBase(TestcontainersPostgreSqlFixture fixture)
	{
		Fixture = fixture;
	}

	/// <summary>
	/// Gets the connection string for the isolated test database.
	/// </summary>
	protected override string ConnectionString => Fixture.ConnectionString;

	/// <summary>
	/// Called before each test. Cleans up data to ensure test isolation within the class.
	/// Override in derived classes if additional per-test setup is needed.
	/// </summary>
	/// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
	public override async Task InitializeAsync()
	{
		// Clean up all tables before each test to ensure isolation
		await TruncateTablesAsync(TestTables.All);
	}
}
