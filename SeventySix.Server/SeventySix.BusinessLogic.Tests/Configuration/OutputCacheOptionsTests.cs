// <copyright file="OutputCacheOptionsTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Configuration;
using SeventySix.BusinessLogic.Configuration;
using Xunit;

namespace SeventySix.BusinessLogic.Tests.Configuration;

/// <summary>
/// Tests for OutputCacheOptions configuration.
/// </summary>
public class OutputCacheOptionsTests
{
	[Fact]
	public void OutputCacheOptions_LoadsFromConfiguration()
	{
		// Arrange
		var configuration = new ConfigurationBuilder()
			.AddJsonFile("appsettings.json")
			.Build();

		// Act
		var options = configuration
			.GetSection(OutputCacheOptions.SECTION_NAME)
			.Get<OutputCacheOptions>();

		// Assert
		Assert.NotNull(options);
		Assert.NotNull(options.Policies);
		Assert.NotEmpty(options.Policies);
	}

	[Fact]
	public void OutputCacheOptions_WeatherPolicy_HasCorrectConfiguration()
	{
		// Arrange
		var configuration = new ConfigurationBuilder()
			.AddJsonFile("appsettings.json")
			.Build();

		// Act
		var options = configuration
			.GetSection(OutputCacheOptions.SECTION_NAME)
			.Get<OutputCacheOptions>();

		// Assert
		Assert.True(options?.Policies.ContainsKey("Weather"));
		var weatherPolicy = options!.Policies["Weather"];
		Assert.Equal(300, weatherPolicy.DurationSeconds);
		Assert.Equal("weather", weatherPolicy.Tag);
		Assert.True(weatherPolicy.Enabled);
		Assert.Contains("latitude", weatherPolicy.VaryByQuery);
		Assert.Contains("longitude", weatherPolicy.VaryByQuery);
	}

	[Fact]
	public void OutputCacheOptions_UsersPolicy_HasCorrectConfiguration()
	{
		// Arrange
		var configuration = new ConfigurationBuilder()
			.AddJsonFile("appsettings.json")
			.Build();

		// Act
		var options = configuration
			.GetSection(OutputCacheOptions.SECTION_NAME)
			.Get<OutputCacheOptions>();

		// Assert
		Assert.True(options?.Policies.ContainsKey("Users"));
		var usersPolicy = options!.Policies["Users"];
		Assert.Equal(60, usersPolicy.DurationSeconds);
		Assert.Equal("users", usersPolicy.Tag);
		Assert.True(usersPolicy.Enabled);
		Assert.Contains("id", usersPolicy.VaryByQuery);
	}

	[Fact]
	public void OutputCacheOptions_LogsPolicy_HasCorrectConfiguration()
	{
		// Arrange
		var configuration = new ConfigurationBuilder()
			.AddJsonFile("appsettings.json")
			.Build();

		// Act
		var options = configuration
			.GetSection(OutputCacheOptions.SECTION_NAME)
			.Get<OutputCacheOptions>();

		// Assert
		Assert.True(options?.Policies.ContainsKey("Logs"));
		var logsPolicy = options!.Policies["Logs"];
		Assert.Equal(300, logsPolicy.DurationSeconds);
		Assert.Equal("logs", logsPolicy.Tag);
		Assert.True(logsPolicy.Enabled);
		Assert.Contains("logLevel", logsPolicy.VaryByQuery);
		Assert.Contains("page", logsPolicy.VaryByQuery);
	}

	[Fact]
	public void OutputCacheOptions_DevelopmentOverrides_DisablesCaching()
	{
		// Arrange
		var configuration = new ConfigurationBuilder()
			.AddJsonFile("appsettings.json")
			.AddJsonFile("appsettings.Development.json", optional: true)
			.Build();

		// Act
		var options = configuration
			.GetSection(OutputCacheOptions.SECTION_NAME)
			.Get<OutputCacheOptions>();

		// Assert
		Assert.NotNull(options);
		Assert.NotNull(options.Policies);

		// In development, caching should be disabled
		foreach (var policy in options.Policies.Values)
		{
			Assert.False(policy.Enabled);
		}
	}

	[Fact]
	public void CachePolicyConfig_DefaultValues_AreCorrect()
	{
		// Arrange & Act
		var config = new CachePolicyConfig();

		// Assert
		Assert.Equal(0, config.DurationSeconds);
		Assert.Empty(config.VaryByQuery);
		Assert.Equal(string.Empty, config.Tag);
		Assert.True(config.Enabled);
	}

	[Fact]
	public void OutputCacheOptions_SectionName_IsCorrect()
	{
		// Assert
		Assert.Equal("Cache:OutputCache", OutputCacheOptions.SECTION_NAME);
	}

	[Fact]
	public void OutputCacheOptions_DefaultPolicies_IsEmptyDictionary()
	{
		// Arrange & Act
		var options = new OutputCacheOptions();

		// Assert
		Assert.NotNull(options.Policies);
		Assert.Empty(options.Policies);
	}

	[Fact]
	public void OutputCacheOptions_HealthPolicy_HasShortDuration()
	{
		// Arrange
		var configuration = new ConfigurationBuilder()
			.AddJsonFile("appsettings.json")
			.Build();

		// Act
		var options = configuration
			.GetSection(OutputCacheOptions.SECTION_NAME)
			.Get<OutputCacheOptions>();

		// Assert
		Assert.True(options?.Policies.ContainsKey("Health"));
		var healthPolicy = options!.Policies["Health"];
		Assert.Equal(30, healthPolicy.DurationSeconds);
		Assert.Equal("health", healthPolicy.Tag);
		Assert.Empty(healthPolicy.VaryByQuery);
	}

	[Fact]
	public void OutputCacheOptions_LogChartsPolicy_SharesTagWithLogs()
	{
		// Arrange
		var configuration = new ConfigurationBuilder()
			.AddJsonFile("appsettings.json")
			.Build();

		// Act
		var options = configuration
			.GetSection(OutputCacheOptions.SECTION_NAME)
			.Get<OutputCacheOptions>();

		// Assert
		Assert.True(options?.Policies.ContainsKey("LogCharts"));
		Assert.True(options?.Policies.ContainsKey("Logs"));

		var logChartsPolicy = options!.Policies["LogCharts"];
		var logsPolicy = options.Policies["Logs"];

		// Both should share the same tag for coordinated invalidation
		Assert.Equal(logsPolicy.Tag, logChartsPolicy.Tag);
		Assert.Equal("logs", logChartsPolicy.Tag);
	}
}
