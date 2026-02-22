// <copyright file="IdentityApiCollectionDefinition.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Api.Tests.Fixtures;
using SeventySix.TestUtilities.Constants;

namespace SeventySix.Api.Tests.Collections;

/// <summary>
/// Defines the Identity API PostgreSQL collection for parallel execution.
/// Tests involving auth, users, health, and permission controllers use this collection.
/// </summary>
/// <remarks>
/// <para>
/// Each assembly must define its own collection definitions that reference the shared fixtures.
/// Tests within this collection share the same <see cref="IdentityApiPostgreSqlFixture"/> instance.
/// </para>
/// <para>
/// Uses Api-specific fixture with factory pre-warming to eliminate first-test startup latency.
/// </para>
/// </remarks>
[CollectionDefinition(CollectionNames.IdentityPostgreSql)]
public sealed class IdentityApiCollectionDefinition : ICollectionFixture<IdentityApiPostgreSqlFixture>;