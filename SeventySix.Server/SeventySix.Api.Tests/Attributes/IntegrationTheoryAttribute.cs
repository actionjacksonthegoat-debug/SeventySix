// <copyright file="IntegrationTheoryAttribute.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Configuration;

namespace SeventySix.Api.Tests.Attributes;

/// <summary>
/// Custom xUnit Theory attribute that skips integration tests unless explicitly enabled in configuration.
/// Integration tests are those that:
/// - Call external APIs (e.g., OpenWeather)
/// - Connect to deployed PostgreSQL databases
/// - Perform E2E testing against real infrastructure
/// Unit tests should use mocks or TestContainers instead.
/// </summary>
public sealed class IntegrationTheoryAttribute : TheoryAttribute
{
	private static readonly bool RunIntegrationTests;

	static IntegrationTheoryAttribute()
	{
		var configuration = new ConfigurationBuilder()
			.SetBasePath(Directory.GetCurrentDirectory())
			.AddJsonFile("appsettings.json", optional: true)
			.AddJsonFile("appsettings.Test.json", optional: true)
			.AddJsonFile("appsettings.Development.json", optional: true)
			.AddEnvironmentVariables()
			.Build();

		RunIntegrationTests = configuration.GetValue("Testing:RunIntegrationTests", defaultValue: false);
	}

	/// <summary>
	/// Initializes a new instance of the <see cref="IntegrationTheoryAttribute"/> class.
	/// </summary>
	public IntegrationTheoryAttribute()
	{
		if (!RunIntegrationTests)
		{
			Skip = "Integration tests are disabled. Set 'Testing:RunIntegrationTests' to true in appsettings to enable.";
		}
	}
}