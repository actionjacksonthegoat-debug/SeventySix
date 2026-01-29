// <copyright file="GetApiRequestStatisticsQueryHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Constants;
using ZiggyCreatures.Caching.Fusion;

namespace SeventySix.ApiTracking;

/// <summary>
/// Handler for GetApiRequestStatisticsQuery to retrieve aggregated API request statistics.
/// </summary>
/// <remarks>
/// Caching Strategy:
/// - Dashboard statistics rarely change during the day
/// - TTL: 5 minutes (ApiTracking cache default)
/// - Cache invalidation: On new request logged (via scheduled refresh)
/// </remarks>
public static class GetApiRequestStatisticsQueryHandler
{
	/// <summary>
	/// Handles the query to retrieve aggregated statistics for third-party API requests.
	/// </summary>
	/// <param name="query">
	/// The query containing no parameters.
	/// </param>
	/// <param name="repository">
	/// The repository for accessing API request data.
	/// </param>
	/// <param name="cacheProvider">
	/// The FusionCache provider for named cache access.
	/// </param>
	/// <param name="timeProvider">
	/// Time provider for getting today's date.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// Aggregated API request statistics for today.
	/// </returns>
	public static async Task<ThirdPartyApiStatisticsDto> HandleAsync(
		GetApiRequestStatisticsQuery query,
		IThirdPartyApiRequestRepository repository,
		IFusionCacheProvider cacheProvider,
		TimeProvider timeProvider,
		CancellationToken cancellationToken)
	{
		DateOnly today =
			DateOnly.FromDateTime(timeProvider.GetUtcNow().UtcDateTime);

		IFusionCache apiTrackingCache =
			cacheProvider.GetCache(CacheNames.ApiTracking);

		string cacheKey =
			ApiTrackingCacheKeys.DailyStatistics(today);

		ThirdPartyApiStatisticsDto? statistics =
			await apiTrackingCache.GetOrSetAsync(
				cacheKey,
				async cancellation =>
					await repository.GetStatisticsAsync(
						today,
						cancellation),
				token: cancellationToken);

		return statistics ?? new ThirdPartyApiStatisticsDto
		{
			TotalCallsToday = 0,
			TotalApisTracked = 0,
			CallsByApi = [],
			LastCalledByApi = [],
		};
	}
}