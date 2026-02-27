// <copyright file="ThirdPartyApiRequestTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Time.Testing;
using SeventySix.ApiTracking;
using SeventySix.TestUtilities.Builders;
using Shouldly;

namespace SeventySix.Domains.Tests.ApiTracking.Entities;

/// <summary>
/// Unit tests for <see cref="ThirdPartyApiRequest"/> entity.
/// </summary>
/// <remarks>
/// Tests domain logic and business rules for the ThirdPartyApiRequest entity.
/// Follows TDD principles: tests written before implementation.
/// </remarks>
public sealed class ThirdPartyApiRequestTests
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
		DateTimeOffset lastCalledAt =
			request.LastCalledAt
				?? throw new InvalidOperationException("LastCalledAt should not be null");
		lastCalledAt.ShouldBeGreaterThanOrEqualTo(beforeTimestamp);
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
		DateTimeOffset firstCallTimeValue =
			firstCallTime ?? throw new InvalidOperationException("firstCallTime should not be null");
		DateTimeOffset secondCallTimeValue =
			secondCallTime ?? throw new InvalidOperationException("secondCallTime should not be null");
		secondCallTimeValue.ShouldBeGreaterThan(firstCallTimeValue);
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

	[Fact]
	public void DecrementCallCount_DecrementsCounter()
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

		// Act
		request.DecrementCallCount();

		// Assert
		request.CallCount.ShouldBe(4);
	}

	[Fact]
	public void DecrementCallCount_AtZero_IsNoOp()
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
		request.DecrementCallCount();

		// Assert
		request.CallCount.ShouldBe(0);
	}

	[Fact]
	public void DecrementCallCount_FromOne_GoesToZero()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		ThirdPartyApiRequest request =
			new()
			{
				ApiName = "ExternalAPI",
				BaseUrl = "https://api.ExternalAPImap.org",
				CallCount = 1,
				ResetDate =
					DateOnly.FromDateTime(
						timeProvider.GetUtcNow().UtcDateTime),
			};

		// Act
		request.DecrementCallCount();

		// Assert
		request.CallCount.ShouldBe(0);
	}

	/// <summary>
	/// Verifies that ToDto maps all entity fields correctly to the DTO.
	/// </summary>
	[Fact]
	public void ToDto_PopulatedEntity_MapsAllFieldsCorrectly()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		DateTimeOffset lastCalledAt =
			timeProvider.GetUtcNow().AddHours(-1);
		ThirdPartyApiRequest entity =
			new ThirdPartyApiRequestBuilder(timeProvider)
				.WithApiName("GitHub")
				.WithBaseUrl("https://api.github.com")
				.WithCallCount(42)
				.WithLastCalledAt(lastCalledAt)
				.Build();

		// Act
		ThirdPartyApiRequestDto dto = entity.ToDto();

		// Assert
		dto.Id.ShouldBe(entity.Id);
		dto.ApiName.ShouldBe(entity.ApiName);
		dto.BaseUrl.ShouldBe(entity.BaseUrl);
		dto.CallCount.ShouldBe(entity.CallCount);
		dto.LastCalledAt.ShouldBe(entity.LastCalledAt);
		dto.ResetDate.ShouldBe(entity.ResetDate);
	}
}