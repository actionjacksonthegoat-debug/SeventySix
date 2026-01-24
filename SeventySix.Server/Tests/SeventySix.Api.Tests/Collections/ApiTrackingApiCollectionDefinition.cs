// <copyright file="ApiTrackingApiCollectionDefinition.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Api.Tests.Fixtures;
using SeventySix.TestUtilities.Constants;

using Xunit;

namespace SeventySix.Api.Tests.Collections;

/// <summary>
/// Defines the ApiTracking API PostgreSQL collection for parallel execution.
/// Tests involving third-party API request controllers use this collection.
/// </summary>
/// <remarks>
/// <para>
/// Each assembly must define its own collection definitions that reference the shared fixtures.
/// Tests within this collection share the same <see cref="ApiTrackingApiPostgreSqlFixture"/> instance.
/// </para>
/// <para>
/// Uses Api-specific fixture with factory pre-warming to eliminate first-test startup latency.
/// </para>
/// </remarks>
[CollectionDefinition(CollectionNames.ApiTrackingPostgreSql)]
public class ApiTrackingApiCollectionDefinition : ICollectionFixture<ApiTrackingApiPostgreSqlFixture>;