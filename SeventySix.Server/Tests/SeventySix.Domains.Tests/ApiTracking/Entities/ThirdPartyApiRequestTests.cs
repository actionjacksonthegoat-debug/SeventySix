// <copyright file="ThirdPartyApiRequestTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Time.Testing;
using SeventySix.ApiTracking;
using Shouldly;

namespace SeventySix.Domains.Tests.ApiTracking.Entities;

/// <summary>
/// Unit tests for <see cref="ThirdPartyApiRequest"/> entity.
/// </summary>
/// <remarks>
/// Tests domain logic and business rules for the ThirdPartyApiRequest entity.
/// Follows TDD principles: tests written before implementation.
/// </remarks>
public class ThirdPartyApiRequestTests
{
	[Fact]
	public void IncrementCallCount_IncrementsCounterAndUpdatesTimestamp()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		ThirdPartyApiRequest request =
			new()
			{
				ApiName = "ExternalAPI",
				BaseUrl = "https://api.ExternalAPImap.org",
				CallCount = 5,
				ResetDate =
					DateOnly.FromDateTime(
				timeProvider.GetUtcNow().UtcDateTime),
			};
		DateTimeOffset beforeTimestamp =
			timeProvider.GetUtcNow();

		// Act
		request.IncrementCallCount(timeProvider.GetUtcNow());

		// Assert
		request.CallCount.ShouldBe(6);
		request.LastCalledAt.ShouldNotBeNull();
		request.LastCalledAt.Value.ShouldBeGreaterThanOrEqualTo(beforeTimestamp);
	}

	[Fact]
	public void IncrementCallCount_UpdatesLastCalledAtOnEachCall()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		ThirdPartyApiRequest request =
			new()
			{
				ApiName = "ExternalAPI",
				BaseUrl = "https://api.ExternalAPImap.org",
				CallCount = 0,
				ResetDate =
					DateOnly.FromDateTime(
				timeProvider.GetUtcNow().UtcDateTime),
			};

		// Act
		request.IncrementCallCount(timeProvider.GetUtcNow());
		DateTimeOffset? firstCallTime = request.LastCalledAt;

		timeProvider.Advance(TimeSpan.FromMilliseconds(10)); // Ensure time difference

		request.IncrementCallCount(timeProvider.GetUtcNow());
		DateTimeOffset? secondCallTime = request.LastCalledAt;

		// Assert
		request.CallCount.ShouldBe(2);
		firstCallTime.ShouldNotBeNull();
		secondCallTime.ShouldNotBeNull();
		secondCallTime.Value.ShouldBeGreaterThan(firstCallTime.Value);
	}

	[Fact]
	public void ResetCallCount_ResetsCounterToZero()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		ThirdPartyApiRequest request =
			new()
			{
				ApiName = "ExternalAPI",
				BaseUrl = "https://api.ExternalAPImap.org",
				CallCount = 50,
				LastCalledAt =
					timeProvider.GetUtcNow().AddHours(-1),
				ResetDate =
					DateOnly.FromDateTime(
				timeProvider.GetUtcNow().UtcDateTime),
			};
		DateTimeOffset? lastCalledBefore = request.LastCalledAt;
		DateTimeOffset beforeTimestamp =
			timeProvider.GetUtcNow();

		// Act
		request.ResetCallCount();

		// Assert
		request.CallCount.ShouldBe(0);
		request.LastCalledAt.ShouldBe(lastCalledBefore); // LastCalledAt preserved for history
	}

	[Fact]
	public void Constructor_AllowsSettingRequiredProperties()
	{
		// Arrange & Act
		FakeTimeProvider timeProvider = new();
		ThirdPartyApiRequest request =
			new()
			{
				ApiName = "ExternalAPI",
				BaseUrl = "https://api.ExternalAPImap.org",
				CallCount = 10,
				ResetDate =
					DateOnly.FromDateTime(
				timeProvider.GetUtcNow().UtcDateTime),
			};

		// Assert
		request.ApiName.ShouldBe("ExternalAPI");
		request.BaseUrl.ShouldBe("https://api.ExternalAPImap.org");
		request.CallCount.ShouldBe(10);
		request.ResetDate.ShouldBe(DateOnly.FromDateTime(timeProvider.GetUtcNow().UtcDateTime));
	}

	[Fact]
	public void CallCount_DefaultsToZero()
	{
		// Arrange & Act
		FakeTimeProvider timeProvider = new();
		ThirdPartyApiRequest request =
			new()
			{
				ApiName = "ExternalAPI",
				BaseUrl = "https://api.ExternalAPImap.org",
				ResetDate =
					DateOnly.FromDateTime(
				timeProvider.GetUtcNow().UtcDateTime),
			};

		// Assert
		request.CallCount.ShouldBe(0);
	}

	[Fact]
	public void LastCalledAt_IsNullInitially()
	{
		// Arrange & Act
		FakeTimeProvider timeProvider = new();
		ThirdPartyApiRequest request =
			new()
			{
				ApiName = "ExternalAPI",
				BaseUrl = "https://api.ExternalAPImap.org",
				ResetDate =
					DateOnly.FromDateTime(
				timeProvider.GetUtcNow().UtcDateTime),
			};

		// Assert
		request.LastCalledAt.ShouldBeNull();
	}

	[Fact]
	public void IncrementCallCount_CanBeCalledMultipleTimes()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		ThirdPartyApiRequest request =
			new()
			{
				ApiName = "ExternalAPI",
				BaseUrl = "https://api.ExternalAPImap.org",
				ResetDate =
					DateOnly.FromDateTime(
				timeProvider.GetUtcNow().UtcDateTime),
			};

		// Act
		for (int incrementCount = 0; incrementCount < 100; incrementCount++)
		{
			request.IncrementCallCount(timeProvider.GetUtcNow());
		}

		// Assert
		request.CallCount.ShouldBe(100);
		request.LastCalledAt.ShouldNotBeNull();
	}
}