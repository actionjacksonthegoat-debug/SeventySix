// <copyright file="ThirdPartyApiRequestTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Time.Testing;
using SeventySix.ApiTracking;

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
		ThirdPartyApiRequest request = new()
		{
			ApiName = "ExternalAPI",
			BaseUrl = "https://api.ExternalAPImap.org",
			CallCount = 5,
			ResetDate = DateOnly.FromDateTime(timeProvider.GetUtcNow().UtcDateTime),
		};
		DateTime beforeTimestamp = timeProvider.GetUtcNow().UtcDateTime;

		// Act
		request.IncrementCallCount(timeProvider.GetUtcNow().UtcDateTime);

		// Assert
		Assert.Equal(6, request.CallCount);
		Assert.NotNull(request.LastCalledAt);
		Assert.True(request.LastCalledAt >= beforeTimestamp);

	}

	[Fact]
	public void IncrementCallCount_UpdatesLastCalledAtOnEachCall()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		ThirdPartyApiRequest request = new()
		{
			ApiName = "ExternalAPI",
			BaseUrl = "https://api.ExternalAPImap.org",
			CallCount = 0,
			ResetDate = DateOnly.FromDateTime(timeProvider.GetUtcNow().UtcDateTime),
		};

		// Act
		request.IncrementCallCount(timeProvider.GetUtcNow().UtcDateTime);
		DateTime? firstCallTime = request.LastCalledAt;

		timeProvider.Advance(TimeSpan.FromMilliseconds(10)); // Ensure time difference

		request.IncrementCallCount(timeProvider.GetUtcNow().UtcDateTime);
		DateTime? secondCallTime = request.LastCalledAt;

		// Assert
		Assert.Equal(2, request.CallCount);
		Assert.NotNull(firstCallTime);
		Assert.NotNull(secondCallTime);
		Assert.True(secondCallTime > firstCallTime);
	}

	[Fact]
	public void ResetCallCount_ResetsCounterToZero()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		ThirdPartyApiRequest request = new()
		{
			ApiName = "ExternalAPI",
			BaseUrl = "https://api.ExternalAPImap.org",
			CallCount = 50,
			LastCalledAt = timeProvider.GetUtcNow().UtcDateTime.AddHours(-1),
			ResetDate = DateOnly.FromDateTime(timeProvider.GetUtcNow().UtcDateTime),
		};
		DateTime? lastCalledBefore = request.LastCalledAt;
		DateTime beforeTimestamp = timeProvider.GetUtcNow().UtcDateTime;

		// Act
		request.ResetCallCount();

		// Assert
		Assert.Equal(0, request.CallCount);
		Assert.Equal(lastCalledBefore, request.LastCalledAt); // LastCalledAt preserved for history

	}

	[Fact]
	public void Constructor_AllowsSettingRequiredProperties()
	{
		// Arrange & Act
		FakeTimeProvider timeProvider = new();
		ThirdPartyApiRequest request = new()
		{
			ApiName = "ExternalAPI",
			BaseUrl = "https://api.ExternalAPImap.org",
			CallCount = 10,
			ResetDate = DateOnly.FromDateTime(timeProvider.GetUtcNow().UtcDateTime),
		};

		// Assert
		Assert.Equal("ExternalAPI", request.ApiName);
		Assert.Equal("https://api.ExternalAPImap.org", request.BaseUrl);
		Assert.Equal(10, request.CallCount);
		Assert.Equal(DateOnly.FromDateTime(timeProvider.GetUtcNow().UtcDateTime), request.ResetDate);
	}

	[Fact]
	public void CallCount_DefaultsToZero()
	{
		// Arrange & Act
		FakeTimeProvider timeProvider = new();
		ThirdPartyApiRequest request = new()
		{
			ApiName = "ExternalAPI",
			BaseUrl = "https://api.ExternalAPImap.org",
			ResetDate = DateOnly.FromDateTime(timeProvider.GetUtcNow().UtcDateTime),
		};

		// Assert
		Assert.Equal(0, request.CallCount);
	}

	[Fact]
	public void LastCalledAt_IsNullInitially()
	{
		// Arrange & Act
		FakeTimeProvider timeProvider = new();
		ThirdPartyApiRequest request = new()
		{
			ApiName = "ExternalAPI",
			BaseUrl = "https://api.ExternalAPImap.org",
			ResetDate = DateOnly.FromDateTime(timeProvider.GetUtcNow().UtcDateTime),
		};

		// Assert
		Assert.Null(request.LastCalledAt);
	}

	[Fact]
	public void IncrementCallCount_CanBeCalledMultipleTimes()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		ThirdPartyApiRequest request = new()
		{
			ApiName = "ExternalAPI",
			BaseUrl = "https://api.ExternalAPImap.org",
			ResetDate = DateOnly.FromDateTime(timeProvider.GetUtcNow().UtcDateTime),
		};

		// Act
		for (int i = 0; i < 100; i++)
		{
			request.IncrementCallCount(timeProvider.GetUtcNow().UtcDateTime);
		}

		// Assert
		Assert.Equal(100, request.CallCount);
		Assert.NotNull(request.LastCalledAt);
	}
}
