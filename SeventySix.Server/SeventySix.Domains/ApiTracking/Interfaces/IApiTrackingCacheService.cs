// <copyright file="IApiTrackingCacheService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ApiTracking;

/// <summary>
/// Cache operations specific to ApiTracking bounded context.
/// </summary>
/// <remarks>
/// Encapsulates all ApiTracking cache key knowledge within the bounded context.
/// </remarks>
public interface IApiTrackingCacheService
{
	/// <summary>
	/// Invalidates daily statistics cache for a specific date.
	/// </summary>
	/// <param name="date">
	/// The date to invalidate statistics for.
	/// </param>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	public Task InvalidateDailyStatisticsAsync(DateOnly date);

	/// <summary>
	/// Invalidates all API requests cache.
	/// </summary>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	public Task InvalidateAllRequestsAsync();
}