// <copyright file="ReadOnlyPostgreSqlTestBase.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.TestUtilities.TestBases;

/// <summary>
/// Base class for read-only tests that don't modify database state.
/// Skips truncation for faster execution - use only for pure query tests.
/// </summary>
/// <remarks>
/// Use this base class when:
/// - Tests only READ data (no INSERT/UPDATE/DELETE)
/// - Tests use pre-seeded data from <see cref="SeededPostgreSqlFixture"/>
/// - Tests don't require isolation from other tests
///
/// DO NOT use when:
/// - Tests create, modify, or delete data
/// - Tests require clean database state
/// - Tests could interfere with other tests' data.
/// </remarks>
public abstract class ReadOnlyPostgreSqlTestBase : BasePostgreSqlTestBase
{
	private readonly BasePostgreSqlFixture Fixture;

	/// <summary>
	/// Initializes a new instance of the <see cref="ReadOnlyPostgreSqlTestBase"/> class.
	/// </summary>
	/// <param name="fixture">
	/// The PostgreSQL fixture that provides database access.
	/// </param>
	protected ReadOnlyPostgreSqlTestBase(BasePostgreSqlFixture fixture)
	{
		Fixture = fixture;
	}

	/// <inheritdoc/>
	protected override string ConnectionString => Fixture.ConnectionString;

	/// <inheritdoc/>
	/// <remarks>
	/// Overrides base initialization to skip truncation.
	/// Read-only tests don't need clean database state.
	/// </remarks>
	public override Task InitializeAsync() =>
		// No truncation needed - tests are read-only
		Task.CompletedTask;
}