// <copyright file="IRateLimitingService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Core.Interfaces;

/// <summary>
/// Interface for API rate limiting service.
/// </summary>
/// <remarks>
/// Tracks and enforces API call limits to prevent quota exhaustion.
/// Implementations should be thread-safe for concurrent requests.
/// </remarks>
public interface IRateLimitingService
{
	/// <summary>
	/// Checks if an API call can be made without exceeding daily limit.
	/// </summary>
	/// <param name="apiName">The name of the API being called.</param>
	/// <returns>True if call is allowed; otherwise, false.</returns>
	public bool CanMakeRequest(string apiName);

	/// <summary>
	/// Attempts to increment the request count if under the limit.
	/// </summary>
	/// <param name="apiName">The name of the API being called.</param>
	/// <returns>True if the request was counted; false if limit exceeded.</returns>
	public bool TryIncrementRequestCount(string apiName);

	/// <summary>
	/// Gets the current request count for the specified API.
	/// </summary>
	/// <param name="apiName">The name of the API.</param>
	/// <returns>The number of requests made today.</returns>
	public int GetRequestCount(string apiName);

	/// <summary>
	/// Gets the remaining request quota for the specified API.
	/// </summary>
	/// <param name="apiName">The name of the API.</param>
	/// <returns>The number of requests remaining today.</returns>
	public int GetRemainingQuota(string apiName);

	/// <summary>
	/// Gets the time until the rate limit resets (midnight UTC).
	/// </summary>
	/// <returns>TimeSpan until reset.</returns>
	public TimeSpan GetTimeUntilReset();

	/// <summary>
	/// Manually resets the rate limit counter.
	/// </summary>
	/// <param name="apiName">The name of the API to reset.</param>
	/// <remarks>
	/// Only use for testing. Production resets happen automatically at midnight UTC.
	/// </remarks>
	public void ResetCounter(string apiName);
}
