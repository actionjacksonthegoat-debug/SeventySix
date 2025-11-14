// <copyright file="IntegrationTestAttribute.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Configuration;

namespace SeventySix.DataAccess.Tests.Attributes;

/// <summary>
/// Custom xUnit Fact attribute that skips integration tests unless explicitly enabled in configuration.
/// Integration tests are those that:
/// - Call external APIs (e.g., OpenWeather)
/// - Connect to deployed PostgreSQL databases
/// - Perform E2E testing against real infrastructure
/// Unit tests should use mocks or TestContainers instead.
/// </summary>
public sealed class IntegrationTestAttribute : FactAttribute
{
	private static readonly bool RunIntegrationTests;

	static IntegrationTestAttribute()
	{
		IConfigurationRoot configuration = new ConfigurationBuilder()
			.SetBasePath(Directory.GetCurrentDirectory())
			.AddJsonFile("appsettings.json", optional: true)
			.AddJsonFile("appsettings.Test.json", optional: true)
			.AddJsonFile("appsettings.Development.json", optional: true)
			.AddEnvironmentVariables()
			.Build();

		RunIntegrationTests = configuration.GetValue("Testing:RunIntegrationTests", defaultValue: false);
	}

	/// <summary>
	/// Initializes a new instance of the <see cref="IntegrationTestAttribute"/> class.
	/// </summary>
	public IntegrationTestAttribute()
	{
		if (!RunIntegrationTests)
		{
			Skip = "Integration tests are disabled. Set 'Testing:RunIntegrationTests' to true in appsettings to enable.";
		}
	}
}