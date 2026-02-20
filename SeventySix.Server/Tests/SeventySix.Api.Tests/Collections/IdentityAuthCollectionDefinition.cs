// <copyright file="IdentityAuthCollectionDefinition.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Api.Tests.Fixtures;
using SeventySix.TestUtilities.Constants;

namespace SeventySix.Api.Tests.Collections;

/// <summary>
/// Collection for authentication-related Identity tests.
/// Enables parallel execution separate from user management tests.
/// </summary>
[CollectionDefinition(CollectionNames.IdentityAuthPostgreSql)]
public sealed class IdentityAuthCollectionDefinition
	: ICollectionFixture<IdentityAuthApiPostgreSqlFixture>
{
}