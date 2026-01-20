// <copyright file="ProductionConfigTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.IO;
using System.Text.Json;
using Xunit;

namespace SeventySix.ArchitectureTests;

/// <summary>
/// Architecture tests ensuring production configuration is secure.
/// Verifies localhost origins are not present in production settings.
/// </summary>
public class ProductionConfigTests : SourceCodeArchitectureTest
{
	/// <summary>
	/// Verifies production configuration does not contain localhost origins.
	/// </summary>
	/// <remarks>
	/// Localhost origins in production CORS settings could allow local
	/// development environments to make authenticated requests to production.
	/// </remarks>
	[Fact]
	public void Production_Config_Should_Not_Contain_Localhost_Origins()
	{
		string productionConfigPath =
			Path.Combine(
				SolutionRoot,
				"SeventySix.Api",
				"appsettings.Production.json");

		// Skip if production config doesn't exist (CI environments, etc.)
		if (!File.Exists(productionConfigPath))
		{
			return;
		}

		string configContent =
			File.ReadAllText(productionConfigPath);

		JsonDocument document =
			JsonDocument.Parse(configContent);

		// Check Cors:AllowedOrigins if it exists
		if (document.RootElement.TryGetProperty(
			"Cors",
			out JsonElement corsElement) &&
			corsElement.TryGetProperty(
				"AllowedOrigins",
				out JsonElement allowedOriginsElement))
		{
			foreach (JsonElement origin in allowedOriginsElement.EnumerateArray())
			{
				string? originValue =
					origin.GetString();

				Assert.False(
					originValue?.Contains("localhost") == true,
					$"Production CORS should not contain localhost. Found: {originValue}");

				Assert.False(
					originValue?.Contains("127.0.0.1") == true,
					$"Production CORS should not contain 127.0.0.1. Found: {originValue}");
			}
		}

		// Check AllowedHosts
		if (document.RootElement.TryGetProperty(
			"AllowedHosts",
			out JsonElement allowedHostsElement))
		{
			string? allowedHosts =
				allowedHostsElement.GetString();

			Assert.True(
				allowedHosts != "*",
				"Production AllowedHosts should not be wildcard '*'. " +
				"Specify explicit hosts like 'seventysix.app;www.seventysix.app'");
		}
	}

	/// <summary>
	/// Verifies production database connection string doesn't use localhost.
	/// </summary>
	[Fact]
	public void Production_Database_Should_Not_Use_Localhost()
	{
		string productionConfigPath =
			Path.Combine(
				SolutionRoot,
				"SeventySix.Api",
				"appsettings.Production.json");

		// Skip if production config doesn't exist
		if (!File.Exists(productionConfigPath))
		{
			return;
		}

		string configContent =
			File.ReadAllText(productionConfigPath);

		JsonDocument document =
			JsonDocument.Parse(configContent);

		// Check ConnectionStrings if present
		if (document.RootElement.TryGetProperty(
			"ConnectionStrings",
			out JsonElement connectionStringsElement))
		{
			foreach (JsonProperty connectionString in connectionStringsElement.EnumerateObject())
			{
				string? connectionValue =
					connectionString.Value.GetString();

				Assert.False(
					connectionValue?.Contains("localhost") == true ||
					connectionValue?.Contains("127.0.0.1") == true ||
					connectionValue?.Contains("(local)") == true,
					$"Production connection string '{connectionString.Name}' should not use localhost. " +
					$"Found: {connectionValue}");
			}
		}
	}
}