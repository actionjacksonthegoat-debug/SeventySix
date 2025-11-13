// <copyright file="ThirdPartyApiStatisticsResponseTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Core.DTOs.ThirdPartyRequests;

namespace SeventySix.Core.Tests.DTOs.ThirdPartyRequests;

/// <summary>
/// Unit tests for <see cref="ThirdPartyApiStatisticsResponse"/>.
/// </summary>
public class ThirdPartyApiStatisticsResponseTests
{
	[Fact]
	public void Constructor_ShouldInitializeWithDefaultValues()
	{
		// Arrange & Act
		var response = new ThirdPartyApiStatisticsResponse();

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
		var now = DateTime.UtcNow;
		var callsByApi = new Dictionary<string, int>
		{
			{ "OpenWeather", 150 },
			{ "GoogleMaps", 75 },
		};
		var lastCalledByApi = new Dictionary<string, DateTime?>
		{
			{ "OpenWeather", now },
			{ "GoogleMaps", now.AddMinutes(-30) },
		};

		var response = new ThirdPartyApiStatisticsResponse
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
		Assert.Equal(150, response.CallsByApi["OpenWeather"]);
		Assert.Equal(75, response.CallsByApi["GoogleMaps"]);
		Assert.Equal(2, response.LastCalledByApi.Count);
		Assert.Equal(now, response.LastCalledByApi["OpenWeather"]);
		Assert.Equal(now.AddMinutes(-30), response.LastCalledByApi["GoogleMaps"]);
	}

	[Fact]
	public void LastCalledByApi_ShouldAllowNullValues()
	{
		// Arrange
		var lastCalledByApi = new Dictionary<string, DateTime?>
		{
			{ "Api1", DateTime.UtcNow },
			{ "Api2", null },
		};

		var response = new ThirdPartyApiStatisticsResponse
		{
			LastCalledByApi = lastCalledByApi,
		};

		// Assert
		Assert.NotNull(response.LastCalledByApi["Api1"]);
		Assert.Null(response.LastCalledByApi["Api2"]);
	}
}