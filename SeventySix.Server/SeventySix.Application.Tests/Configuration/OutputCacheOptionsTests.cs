// <copyright file="OutputCacheOptionsTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Configuration;
using SeventySix.Application.Configuration;
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
		IConfigurationRoot configuration = new ConfigurationBuilder()
			.AddJsonFile("appsettings.json")
			.Build();

		// Act
		OutputCacheOptions? options = configuration
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
		IConfigurationRoot configuration = new ConfigurationBuilder()
			.AddJsonFile("appsettings.json")
			.Build();

		// Act
		OutputCacheOptions? options = configuration
			.GetSection(OutputCacheOptions.SECTION_NAME)
			.Get<OutputCacheOptions>();

		// Assert
		Assert.True(options?.Policies.ContainsKey("weather"));
		CachePolicyConfig weatherPolicy = options!.Policies["weather"];
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
		IConfigurationRoot configuration = new ConfigurationBuilder()
			.AddJsonFile("appsettings.json")
			.Build();

		// Act
		OutputCacheOptions? options = configuration
			.GetSection(OutputCacheOptions.SECTION_NAME)
			.Get<OutputCacheOptions>();

		// Assert
		Assert.True(options?.Policies.ContainsKey("users"));
		CachePolicyConfig usersPolicy = options!.Policies["users"];
		Assert.Equal(60, usersPolicy.DurationSeconds);
		Assert.Equal("users", usersPolicy.Tag);
		Assert.True(usersPolicy.Enabled);
		Assert.Contains("id", usersPolicy.VaryByQuery);
	}

	[Fact]
	public void OutputCacheOptions_LogsPolicy_HasCorrectConfiguration()
	{
		// Arrange
		IConfigurationRoot configuration = new ConfigurationBuilder()
			.AddJsonFile("appsettings.json")
			.Build();

		// Act
		OutputCacheOptions? options = configuration
			.GetSection(OutputCacheOptions.SECTION_NAME)
			.Get<OutputCacheOptions>();

		// Assert
		Assert.True(options?.Policies.ContainsKey("logs"));
		CachePolicyConfig logsPolicy = options!.Policies["logs"];
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
		IConfigurationRoot configuration = new ConfigurationBuilder()
			.AddJsonFile("appsettings.json")
			.AddJsonFile("appsettings.Development.json", optional: true)
			.Build();

		// Act
		OutputCacheOptions? options = configuration
			.GetSection(OutputCacheOptions.SECTION_NAME)
			.Get<OutputCacheOptions>();

		// Assert
		Assert.NotNull(options);
		Assert.NotNull(options.Policies);

		// In development, caching should be disabled
		foreach (CachePolicyConfig policy in options.Policies.Values)
		{
			Assert.False(policy.Enabled);
		}
	}

	[Fact]
	public void CachePolicyConfig_DefaultValues_AreCorrect()
	{
		// Arrange & Act
		CachePolicyConfig config = new();

		// Assert
		Assert.Equal(0, config.DurationSeconds);
		Assert.Empty(config.VaryByQuery);
		Assert.Equal(string.Empty, config.Tag);
		Assert.True(config.Enabled);
	}

	[Fact]
	public void OutputCacheOptions_SectionName_IsCorrect() =>
		// Assert
		Assert.Equal("Cache:OutputCache", OutputCacheOptions.SECTION_NAME);

	[Fact]
	public void OutputCacheOptions_DefaultPolicies_IsEmptyDictionary()
	{
		// Arrange & Act
		OutputCacheOptions options = new();

		// Assert
		Assert.NotNull(options.Policies);
		Assert.Empty(options.Policies);
	}

	[Fact]
	public void OutputCacheOptions_HealthPolicy_HasShortDuration()
	{
		// Arrange
		IConfigurationRoot configuration = new ConfigurationBuilder()
			.AddJsonFile("appsettings.json")
			.Build();

		// Act
		OutputCacheOptions? options = configuration
			.GetSection(OutputCacheOptions.SECTION_NAME)
			.Get<OutputCacheOptions>();

		// Assert
		Assert.True(options?.Policies.ContainsKey("health"));
		CachePolicyConfig healthPolicy = options!.Policies["health"];
		Assert.Equal(30, healthPolicy.DurationSeconds);
		Assert.Equal("health", healthPolicy.Tag);
		Assert.Empty(healthPolicy.VaryByQuery);
	}

	[Fact]
	public void OutputCacheOptions_LogChartsPolicy_SharesTagWithLogs()
	{
		// Arrange
		IConfigurationRoot configuration = new ConfigurationBuilder()
			.AddJsonFile("appsettings.json")
			.Build();

		// Act
		OutputCacheOptions? options = configuration
			.GetSection(OutputCacheOptions.SECTION_NAME)
			.Get<OutputCacheOptions>();

		// Assert
		Assert.True(options?.Policies.ContainsKey("logcharts"));
		Assert.True(options?.Policies.ContainsKey("logs"));

		CachePolicyConfig logChartsPolicy = options!.Policies["logcharts"];
		CachePolicyConfig logsPolicy = options.Policies["logs"];

		// Both should share the same tag for coordinated invalidation
		Assert.Equal(logsPolicy.Tag, logChartsPolicy.Tag);
		Assert.Equal("logs", logChartsPolicy.Tag);
	}
}