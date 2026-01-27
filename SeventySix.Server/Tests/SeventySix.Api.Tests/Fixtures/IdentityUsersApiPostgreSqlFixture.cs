// <copyright file="IdentityUsersApiPostgreSqlFixture.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.TestUtilities.TestBases;

namespace SeventySix.Api.Tests.Fixtures;

/// <summary>
/// Fixture for user management Identity API tests.
/// Provides database isolation for user-related test classes.
/// </summary>
public sealed class IdentityUsersApiPostgreSqlFixture : DomainPostgreSqlFixture
{
	/// <summary>
	/// Initializes a new instance of the <see cref="IdentityUsersApiPostgreSqlFixture"/> class.
	/// </summary>
	public IdentityUsersApiPostgreSqlFixture()
		: base("IdentityUsers")
	{
	}
}