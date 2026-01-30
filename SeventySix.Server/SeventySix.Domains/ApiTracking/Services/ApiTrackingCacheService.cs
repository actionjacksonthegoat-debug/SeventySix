// <copyright file="ApiTrackingCacheService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Constants;
using SeventySix.Shared.Interfaces;

namespace SeventySix.ApiTracking;

/// <summary>
/// ApiTracking-specific cache invalidation service.
/// Encapsulates all ApiTracking cache key knowledge within the bounded context.
/// </summary>
/// <param name="cacheProvider">
/// The generic cache provider for cache operations.
/// </param>
public sealed class ApiTrackingCacheService(
	ICacheProvider cacheProvider) : IApiTrackingCacheService
{
	/// <inheritdoc />
	public async Task InvalidateDailyStatisticsAsync(DateOnly date)
	{
		await cacheProvider.RemoveAsync(
			CacheNames.ApiTracking,
			ApiTrackingCacheKeys.DailyStatistics(date));
	}

	/// <inheritdoc />
	public async Task InvalidateAllRequestsAsync()
	{
		await cacheProvider.RemoveAsync(
			CacheNames.ApiTracking,
			ApiTrackingCacheKeys.AllRequests());
	}
}
