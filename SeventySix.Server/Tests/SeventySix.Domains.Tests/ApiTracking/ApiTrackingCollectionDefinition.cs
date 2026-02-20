using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;

namespace SeventySix.Domains.Tests.ApiTracking;

/// <summary>
/// Defines the xUnit collection for ApiTracking domain integration tests.
/// Tests in this collection share an <see cref="ApiTrackingPostgreSqlFixture"/> instance
/// and run in parallel with tests from other domain collections.
/// </summary>
[CollectionDefinition(CollectionNames.ApiTrackingPostgreSql)]
public sealed class ApiTrackingCollectionDefinition : ICollectionFixture<ApiTrackingPostgreSqlFixture>;