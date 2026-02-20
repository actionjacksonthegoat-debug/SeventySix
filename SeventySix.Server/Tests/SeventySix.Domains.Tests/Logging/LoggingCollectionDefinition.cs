using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;

namespace SeventySix.Domains.Tests.Logging;

/// <summary>
/// Defines the xUnit collection for Logging domain integration tests.
/// Tests in this collection share a <see cref="LoggingPostgreSqlFixture"/> instance
/// and run in parallel with tests from other domain collections.
/// </summary>
[CollectionDefinition(CollectionNames.LoggingPostgreSql)]
public sealed class LoggingCollectionDefinition : ICollectionFixture<LoggingPostgreSqlFixture>;