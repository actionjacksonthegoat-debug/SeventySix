// <copyright file="IdentityApiPostgreSqlFixture.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.TestUtilities.TestBases;

namespace SeventySix.Api.Tests.Fixtures;

/// <summary>
/// Identity domain PostgreSQL fixture for API integration tests.
/// Provides domain isolation with shared PostgreSQL container.
/// </summary>
public sealed class IdentityApiPostgreSqlFixture : DomainPostgreSqlFixture
{
	/// <summary>
	/// Initializes a new instance of the <see cref="IdentityApiPostgreSqlFixture"/> class.
	/// </summary>
	public IdentityApiPostgreSqlFixture()
		: base("Identity")
	{
	}
}