// <copyright file="IdentityAuthApiPostgreSqlFixture.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.TestUtilities.TestBases;

namespace SeventySix.Api.Tests.Fixtures;

/// <summary>
/// Fixture for authentication-specific Identity API tests.
/// Provides database isolation for auth-related test classes.
/// </summary>
public sealed class IdentityAuthApiPostgreSqlFixture : DomainPostgreSqlFixture
{
	/// <summary>
	/// Initializes a new instance of the <see cref="IdentityAuthApiPostgreSqlFixture"/> class.
	/// </summary>
	public IdentityAuthApiPostgreSqlFixture()
		: base("IdentityAuth")
	{
	}
}