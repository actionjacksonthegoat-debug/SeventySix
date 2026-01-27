// <copyright file="IdentityHealthCollectionDefinition.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Api.Tests.Fixtures;
using SeventySix.TestUtilities.Constants;

namespace SeventySix.Api.Tests.Collections;

/// <summary>
/// Collection for health check and permission-related Identity tests.
/// Enables parallel execution separate from auth and user tests.
/// </summary>
[CollectionDefinition(CollectionNames.IdentityHealthPostgreSql)]
public class IdentityHealthCollectionDefinition
	: ICollectionFixture<IdentityHealthApiPostgreSqlFixture>
{
}