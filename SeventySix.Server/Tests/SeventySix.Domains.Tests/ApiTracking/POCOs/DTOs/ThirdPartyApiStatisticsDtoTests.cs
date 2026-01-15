// <copyright file="ThirdPartyApiStatisticsDtoTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Time.Testing;
using SeventySix.ApiTracking;

namespace SeventySix.Domains.Tests.ApiTracking.POCOs.DTOs;

/// <summary>
/// Unit tests for <see cref="ThirdPartyApiStatisticsDto"/>.
/// </summary>
public class ThirdPartyApiStatisticsDtoTests
{
	[Fact]
	public void Constructor_ShouldInitializeWithDefaultValues()
	{
		// Arrange & Act
		ThirdPartyApiStatisticsDto dto = new();

		// Assert
		Assert.Equal(0, dto.TotalCallsToday);
		Assert.Equal(0, dto.TotalApisTracked);
		Assert.NotNull(dto.CallsByApi);
		Assert.Empty(dto.CallsByApi);
		Assert.NotNull(dto.LastCalledByApi);
		Assert.Empty(dto.LastCalledByApi);
	}

	[Fact]
	public void Properties_ShouldSetAndGetCorrectly()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;
		Dictionary<string, int> callsByApi =
			new()
			{
			{ "ExternalAPI", 150 },
			{ "GoogleMaps", 75 },
		};
		Dictionary<string, DateTime?> lastCalledByApi =
			new()
			{
			{ "ExternalAPI", now },
			{ "GoogleMaps", now.AddMinutes(-30) },
		};

		ThirdPartyApiStatisticsDto dto =
			new()
			{
				TotalCallsToday = 225,
				TotalApisTracked = 2,
				CallsByApi = callsByApi,
				LastCalledByApi = lastCalledByApi,
			};

		// Assert
		Assert.Equal(225, dto.TotalCallsToday);
		Assert.Equal(2, dto.TotalApisTracked);
		Assert.Equal(2, dto.CallsByApi.Count);
		Assert.Equal(150, dto.CallsByApi["ExternalAPI"]);
		Assert.Equal(75, dto.CallsByApi["GoogleMaps"]);
		Assert.Equal(2, dto.LastCalledByApi.Count);
		Assert.Equal(now, dto.LastCalledByApi["ExternalAPI"]);
		Assert.Equal(
			now.AddMinutes(-30),
			dto.LastCalledByApi["GoogleMaps"]);
	}

	[Fact]
	public void LastCalledByApi_ShouldAllowNullValues()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		Dictionary<string, DateTime?> lastCalledByApi =
			new()
			{
			{ "Api1", timeProvider.GetUtcNow().UtcDateTime },
			{ "Api2", null },
		};

		ThirdPartyApiStatisticsDto dto =
			new()
			{
				LastCalledByApi = lastCalledByApi,
			};

		// Assert
		Assert.NotNull(dto.LastCalledByApi["Api1"]);
		Assert.Null(dto.LastCalledByApi["Api2"]);
	}
}
