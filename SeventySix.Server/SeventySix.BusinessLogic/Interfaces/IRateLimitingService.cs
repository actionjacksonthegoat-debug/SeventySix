// <copyright file="IRateLimitingService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.BusinessLogic.Interfaces;

/// <summary>
/// Interface for API rate limiting service.
/// </summary>
/// <remarks>
/// Tracks and enforces API call limits to prevent quota exhaustion.
/// Implementations should be thread-safe for concurrent requests.
/// Database-backed implementation provides persistence across application restarts.
/// </remarks>
public interface IRateLimitingService
{
	/// <summary>
	/// Checks if an API call can be made without exceeding daily limit.
	/// </summary>
	/// <param name="apiName">The name of the API being called.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>True if call is allowed; otherwise, false.</returns>
	public Task<bool> CanMakeRequestAsync(string apiName, CancellationToken cancellationToken = default);

	/// <summary>
	/// Attempts to increment the request count if under the limit.
	/// </summary>
	/// <param name="apiName">The name of the API being called.</param>
	/// <param name="baseUrl">The base URL of the API (e.g., "https://api.example.com").</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>True if the request was counted; false if limit exceeded.</returns>
	public Task<bool> TryIncrementRequestCountAsync(string apiName, string baseUrl, CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets the current request count for the specified API.
	/// </summary>
	/// <param name="apiName">The name of the API.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>The number of requests made today.</returns>
	public Task<int> GetRequestCountAsync(string apiName, CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets the remaining request quota for the specified API.
	/// </summary>
	/// <param name="apiName">The name of the API.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>The number of requests remaining today.</returns>
	public Task<int> GetRemainingQuotaAsync(string apiName, CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets the time until the rate limit resets (midnight UTC).
	/// </summary>
	/// <returns>TimeSpan until reset.</returns>
	public TimeSpan GetTimeUntilReset();

	/// <summary>
	/// Manually resets the rate limit counter.
	/// </summary>
	/// <param name="apiName">The name of the API to reset.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <remarks>
	/// Only use for testing. Production resets happen automatically via date-based logic.
	/// </remarks>
	public Task ResetCounterAsync(string apiName, CancellationToken cancellationToken = default);
}