// <copyright file="LoggingApiPostgreSqlFixture.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.TestUtilities.TestBases;

namespace SeventySix.Api.Tests.Fixtures;

/// <summary>
/// Logging domain PostgreSQL fixture for API integration tests.
/// Provides domain isolation with shared PostgreSQL container.
/// </summary>
public sealed class LoggingApiPostgreSqlFixture : DomainPostgreSqlFixture
{
	/// <summary>
	/// Initializes a new instance of the <see cref="LoggingApiPostgreSqlFixture"/> class.
	/// </summary>
	public LoggingApiPostgreSqlFixture()
		: base("Logging")
	{
	}
}