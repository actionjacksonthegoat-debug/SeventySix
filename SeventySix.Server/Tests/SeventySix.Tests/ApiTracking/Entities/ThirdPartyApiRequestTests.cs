// <copyright file="ThirdPartyApiRequestTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.ApiTracking;

namespace SeventySix.Tests.ApiTracking;

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
		ThirdPartyApiRequest request = new()
		{
			ApiName = "ExternalAPI",
			BaseUrl = "https://api.ExternalAPImap.org",
			CallCount = 5,
			ResetDate = DateOnly.FromDateTime(DateTime.UtcNow),
		};
		DateTime beforeTimestamp = DateTime.UtcNow;

		// Act
		request.IncrementCallCount();

		// Assert
		Assert.Equal(6, request.CallCount);
		Assert.NotNull(request.LastCalledAt);
		Assert.True(request.LastCalledAt >= beforeTimestamp);

	}

	[Fact]
	public void IncrementCallCount_UpdatesLastCalledAtOnEachCall()
	{
		// Arrange
		ThirdPartyApiRequest request = new()
		{
			ApiName = "ExternalAPI",
			BaseUrl = "https://api.ExternalAPImap.org",
			CallCount = 0,
			ResetDate = DateOnly.FromDateTime(DateTime.UtcNow),
		};

		// Act
		request.IncrementCallCount();
		DateTime? firstCallTime = request.LastCalledAt;

		Thread.Sleep(10); // Ensure time difference

		request.IncrementCallCount();
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
		ThirdPartyApiRequest request = new()
		{
			ApiName = "ExternalAPI",
			BaseUrl = "https://api.ExternalAPImap.org",
			CallCount = 50,
			LastCalledAt = DateTime.UtcNow.AddHours(-1),
			ResetDate = DateOnly.FromDateTime(DateTime.UtcNow),
		};
		DateTime? lastCalledBefore = request.LastCalledAt;
		DateTime beforeTimestamp = DateTime.UtcNow;

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
		ThirdPartyApiRequest request = new()
		{
			ApiName = "ExternalAPI",
			BaseUrl = "https://api.ExternalAPImap.org",
			CallCount = 10,
			ResetDate = DateOnly.FromDateTime(DateTime.UtcNow),
		};

		// Assert
		Assert.Equal("ExternalAPI", request.ApiName);
		Assert.Equal("https://api.ExternalAPImap.org", request.BaseUrl);
		Assert.Equal(10, request.CallCount);
		Assert.Equal(DateOnly.FromDateTime(DateTime.UtcNow), request.ResetDate);
	}

	[Fact]
	public void CallCount_DefaultsToZero()
	{
		// Arrange & Act
		ThirdPartyApiRequest request = new()
		{
			ApiName = "ExternalAPI",
			BaseUrl = "https://api.ExternalAPImap.org",
			ResetDate = DateOnly.FromDateTime(DateTime.UtcNow),
		};

		// Assert
		Assert.Equal(0, request.CallCount);
	}

	[Fact]
	public void LastCalledAt_IsNullInitially()
	{
		// Arrange & Act
		ThirdPartyApiRequest request = new()
		{
			ApiName = "ExternalAPI",
			BaseUrl = "https://api.ExternalAPImap.org",
			ResetDate = DateOnly.FromDateTime(DateTime.UtcNow),
		};

		// Assert
		Assert.Null(request.LastCalledAt);
	}

	[Fact]
	public void IncrementCallCount_CanBeCalledMultipleTimes()
	{
		// Arrange
		ThirdPartyApiRequest request = new()
		{
			ApiName = "ExternalAPI",
			BaseUrl = "https://api.ExternalAPImap.org",
			ResetDate = DateOnly.FromDateTime(DateTime.UtcNow),
		};

		// Act
		for (int i = 0; i < 100; i++)
		{
			request.IncrementCallCount();
		}

		// Assert
		Assert.Equal(100, request.CallCount);
		Assert.NotNull(request.LastCalledAt);
	}
}