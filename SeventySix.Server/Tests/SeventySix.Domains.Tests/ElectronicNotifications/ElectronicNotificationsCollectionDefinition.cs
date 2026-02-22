using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;

namespace SeventySix.Domains.Tests.ElectronicNotifications;

/// <summary>
/// Defines the xUnit collection for ElectronicNotifications domain integration tests.
/// Tests in this collection share an <see cref="ElectronicNotificationsPostgreSqlFixture"/> instance
/// and run in parallel with tests from other domain collections.
/// </summary>
[CollectionDefinition(CollectionNames.ElectronicNotificationsPostgreSql)]
public sealed class ElectronicNotificationsCollectionDefinition : ICollectionFixture<ElectronicNotificationsPostgreSqlFixture>;