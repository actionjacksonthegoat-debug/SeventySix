// <copyright file="IntegrationTestAttribute.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Configuration;
using Xunit;

namespace SeventySix.TestUtilities.Attributes;

/// <summary>
/// Custom xUnit Fact attribute that skips integration tests unless explicitly enabled in configuration.
/// This attribute is ONLY for tests that call external third-party APIs.
///
/// IMPORTANT: Tests using TestContainers for PostgreSQL are NOT integration tests.
/// TestContainers provide isolated database infrastructure for fast, reliable tests.
/// Database tests should use [Fact] attribute and mock all external APIs.
///
/// Use this attribute ONLY for:
/// - Tests that call real external third-party APIs
/// - Tests that validate actual connectivity to external services
///
/// Do NOT use this attribute for:
/// - Tests using TestContainers (these are database tests, not integration tests)
/// - Tests that mock external API clients (these are unit/database tests)
/// - Controller tests (should mock external dependencies)
/// - Repository tests (should mock external dependencies)
/// </summary>
public sealed class IntegrationTestAttribute : FactAttribute
{
	private static readonly bool RunIntegrationTests;

	static IntegrationTestAttribute()
	{
		IConfigurationRoot configuration =
			new ConfigurationBuilder()
			.SetBasePath(Directory.GetCurrentDirectory())
			.AddJsonFile("appsettings.json", optional: true)
			.AddJsonFile("appsettings.Test.json", optional: true)
			.AddJsonFile("appsettings.Development.json", optional: true)
			.AddEnvironmentVariables()
			.Build();

		RunIntegrationTests =
			configuration.GetValue(
			"Testing:RunIntegrationTests",
			defaultValue: false);
	}

	/// <summary>
	/// Initializes a new instance of the <see cref="IntegrationTestAttribute"/> class.
	/// </summary>
	public IntegrationTestAttribute()
	{
		if (!RunIntegrationTests)
		{
			Skip =
				"Integration tests are disabled. Set 'Testing:RunIntegrationTests' to true in appsettings to enable.";
		}
	}
}