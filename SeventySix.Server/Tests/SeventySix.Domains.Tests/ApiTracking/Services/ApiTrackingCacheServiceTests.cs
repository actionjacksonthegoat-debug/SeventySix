// <copyright file="ApiTrackingCacheServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using NSubstitute;
using SeventySix.ApiTracking;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Interfaces;
using Shouldly;

namespace SeventySix.Domains.Tests.ApiTracking.Services;

/// <summary>
/// Unit tests for <see cref="ApiTrackingCacheService"/>.
/// </summary>
/// <remarks>
/// Follows 80/20 rule: tests critical paths for cache invalidation.
/// Verifies correct cache keys are passed to the cache provider.
/// </remarks>
public sealed class ApiTrackingCacheServiceTests
{
	private readonly ICacheProvider CacheProvider;
	private readonly ApiTrackingCacheService ServiceUnderTest;

	/// <summary>
	/// Initializes a new instance of the <see cref="ApiTrackingCacheServiceTests"/> class.
	/// </summary>
	public ApiTrackingCacheServiceTests()
	{
		CacheProvider =
			Substitute.For<ICacheProvider>();

		ServiceUnderTest =
			new ApiTrackingCacheService(CacheProvider);
	}

	/// <summary>
	/// Verifies InvalidateDailyStatisticsAsync removes daily statistics cache key.
	/// </summary>
	[Fact]
	public async Task InvalidateDailyStatisticsAsync_WithDate_RemovesStatisticsKeyAsync()
	{
		// Arrange
		DateOnly testDate =
			new(2026, 1, 30);

		// Act
		await ServiceUnderTest.InvalidateDailyStatisticsAsync(testDate);

		// Assert
		await CacheProvider.Received(1)
			.RemoveAsync(
				CacheNames.ApiTracking,
				ApiTrackingCacheKeys.DailyStatistics(testDate));
	}

	/// <summary>
	/// Verifies InvalidateAllRequestsAsync removes all requests cache key.
	/// </summary>
	[Fact]
	public async Task InvalidateAllRequestsAsync_RemovesAllRequestsKeyAsync()
	{
		// Act
		await ServiceUnderTest.InvalidateAllRequestsAsync();

		// Assert
		await CacheProvider.Received(1)
			.RemoveAsync(
				CacheNames.ApiTracking,
				ApiTrackingCacheKeys.AllRequests());
	}
}