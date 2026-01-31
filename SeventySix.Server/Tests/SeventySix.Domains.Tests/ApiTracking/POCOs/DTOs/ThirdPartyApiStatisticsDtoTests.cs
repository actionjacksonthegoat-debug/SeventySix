// <copyright file="ThirdPartyApiStatisticsDtoTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Time.Testing;
using SeventySix.ApiTracking;
using Shouldly;

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
		dto.TotalCallsToday.ShouldBe(0);
		dto.TotalApisTracked.ShouldBe(0);
		dto.CallsByApi.ShouldNotBeNull();
		dto.CallsByApi.ShouldBeEmpty();
		dto.LastCalledByApi.ShouldNotBeNull();
		dto.LastCalledByApi.ShouldBeEmpty();
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
		dto.TotalCallsToday.ShouldBe(225);
		dto.TotalApisTracked.ShouldBe(2);
		dto.CallsByApi.Count.ShouldBe(2);
		dto.CallsByApi["ExternalAPI"].ShouldBe(150);
		dto.CallsByApi["GoogleMaps"].ShouldBe(75);
		dto.LastCalledByApi.Count.ShouldBe(2);
		dto.LastCalledByApi["ExternalAPI"].ShouldBe(now);
		dto.LastCalledByApi["GoogleMaps"].ShouldBe(now.AddMinutes(-30));
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
		dto.LastCalledByApi["Api1"].ShouldNotBeNull();
		dto.LastCalledByApi["Api2"].ShouldBeNull();
	}
}