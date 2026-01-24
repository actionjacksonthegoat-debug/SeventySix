// <copyright file="ApiTrackingApiPostgreSqlFixture.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.TestUtilities.TestBases;

namespace SeventySix.Api.Tests.Fixtures;

/// <summary>
/// ApiTracking domain PostgreSQL fixture for API integration tests.
/// Provides domain isolation with shared PostgreSQL container.
/// </summary>
public sealed class ApiTrackingApiPostgreSqlFixture : DomainPostgreSqlFixture
{
	/// <summary>
	/// Initializes a new instance of the <see cref="ApiTrackingApiPostgreSqlFixture"/> class.
	/// </summary>
	public ApiTrackingApiPostgreSqlFixture()
		: base("ApiTracking")
	{
	}
}