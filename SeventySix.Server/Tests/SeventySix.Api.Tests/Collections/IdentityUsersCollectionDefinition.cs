// <copyright file="IdentityUsersCollectionDefinition.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Api.Tests.Fixtures;
using SeventySix.TestUtilities.Constants;

namespace SeventySix.Api.Tests.Collections;

/// <summary>
/// Collection for user management Identity tests.
/// Enables parallel execution separate from authentication tests.
/// </summary>
[CollectionDefinition(CollectionNames.IdentityUsersPostgreSql)]
public class IdentityUsersCollectionDefinition
	: ICollectionFixture<IdentityUsersApiPostgreSqlFixture>
{
}