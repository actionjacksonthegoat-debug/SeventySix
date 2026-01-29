// <copyright file="ApiTrackingCacheKeys.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ApiTracking;

/// <summary>
/// Provides consistent cache key generation for ApiTracking domain.
/// </summary>
/// <remarks>
/// Cache key patterns follow the convention: apitracking:{entity}:{identifier}
/// This enables:
/// - Clear namespace separation by domain
/// - Pattern-based cache invalidation
/// - Easy debugging and monitoring in Valkey CLI
/// </remarks>
public static class ApiTrackingCacheKeys
{
	/// <summary>
	/// Cache key prefix for ApiTracking domain.
	/// </summary>
	private const string PREFIX = "apitracking";

	/// <summary>
	/// Generates a cache key for daily statistics.
	/// </summary>
	/// <param name="date">
	/// The date for statistics.
	/// </param>
	/// <returns>
	/// Cache key in format "apitracking:stats:{date}".
	/// </returns>
	public static string DailyStatistics(DateOnly date)
	{
		return $"{PREFIX}:stats:{date:yyyy-MM-dd}";
	}

	/// <summary>
	/// Generates a cache key for all API requests list.
	/// </summary>
	/// <returns>
	/// Cache key "apitracking:all-requests".
	/// </returns>
	public static string AllRequests()
	{
		return $"{PREFIX}:all-requests";
	}
}
