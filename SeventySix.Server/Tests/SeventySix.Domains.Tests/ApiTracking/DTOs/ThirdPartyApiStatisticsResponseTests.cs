// <copyright file="ThirdPartyApiStatisticsResponseTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.ApiTracking;

namespace SeventySix.Domains.Tests.ApiTracking.DTOs;

/// <summary>
/// Unit tests for <see cref="ThirdPartyApiStatisticsResponse"/>.
/// </summary>
public class ThirdPartyApiStatisticsResponseTests
{
	[Fact]
	public void Constructor_ShouldInitializeWithDefaultValues()
	{
		// Arrange & Act
		ThirdPartyApiStatisticsResponse response = new();

		// Assert
		Assert.Equal(0, response.TotalCallsToday);
		Assert.Equal(0, response.TotalApisTracked);
		Assert.NotNull(response.CallsByApi);
		Assert.Empty(response.CallsByApi);
		Assert.NotNull(response.LastCalledByApi);
		Assert.Empty(response.LastCalledByApi);
	}

	[Fact]
	public void Properties_ShouldSetAndGetCorrectly()
	{
		// Arrange
		DateTime now = DateTime.UtcNow;
		Dictionary<string, int> callsByApi = new()
		{
			{ "ExternalAPI", 150 },
			{ "GoogleMaps", 75 },
		};
		Dictionary<string, DateTime?> lastCalledByApi = new()
		{
			{ "ExternalAPI", now },
			{ "GoogleMaps", now.AddMinutes(-30) },
		};

		ThirdPartyApiStatisticsResponse response = new()
		{
			TotalCallsToday = 225,
			TotalApisTracked = 2,
			CallsByApi = callsByApi,
			LastCalledByApi = lastCalledByApi,
		};

		// Assert
		Assert.Equal(225, response.TotalCallsToday);
		Assert.Equal(2, response.TotalApisTracked);
		Assert.Equal(2, response.CallsByApi.Count);
		Assert.Equal(150, response.CallsByApi["ExternalAPI"]);
		Assert.Equal(75, response.CallsByApi["GoogleMaps"]);
		Assert.Equal(2, response.LastCalledByApi.Count);
		Assert.Equal(now, response.LastCalledByApi["ExternalAPI"]);
		Assert.Equal(now.AddMinutes(-30), response.LastCalledByApi["GoogleMaps"]);
	}

	[Fact]
	public void LastCalledByApi_ShouldAllowNullValues()
	{
		// Arrange
		Dictionary<string, DateTime?> lastCalledByApi = new()
		{
			{ "Api1", DateTime.UtcNow },
			{ "Api2", null },
		};

		ThirdPartyApiStatisticsResponse response = new()
		{
			LastCalledByApi = lastCalledByApi,
		};

		// Assert
		Assert.NotNull(response.LastCalledByApi["Api1"]);
		Assert.Null(response.LastCalledByApi["Api2"]);
	}
}