using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;

namespace SeventySix.Identity.Tests;

/// <summary>
/// Defines the xUnit collection for Identity domain integration tests.
/// Tests in this collection share an <see cref="IdentityPostgreSqlFixture"/> instance
/// and run in parallel with tests from other domain collections.
/// </summary>
[CollectionDefinition(CollectionNames.IdentityPostgreSql)]
public sealed class IdentityCollectionDefinition : ICollectionFixture<IdentityPostgreSqlFixture>;