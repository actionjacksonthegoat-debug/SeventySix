// <copyright file="IdentityHealthApiPostgreSqlFixture.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.TestUtilities.TestBases;

namespace SeventySix.Api.Tests.Fixtures;

/// <summary>
/// Fixture for health check and permission Identity API tests.
/// Provides database isolation for health and permission test classes.
/// </summary>
public sealed class IdentityHealthApiPostgreSqlFixture : DomainPostgreSqlFixture
{
	/// <summary>
	/// Initializes a new instance of the <see cref="IdentityHealthApiPostgreSqlFixture"/> class.
	/// </summary>
	public IdentityHealthApiPostgreSqlFixture()
		: base("IdentityHealth")
	{
	}
}