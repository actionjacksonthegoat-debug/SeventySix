// <copyright file="IRateLimitingService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Interfaces;

/// <summary>
/// API rate limiting service - tracks and enforces API call limits.
/// Supports both daily and monthly intervals.
/// </summary>
public interface IRateLimitingService
{
	/// <summary>
	/// Checks if an API call is allowed under the configured limit for the API's interval.
	/// </summary>
	/// <param name="apiName">
	/// The logical API name used to track quotas.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token to cancel the operation.
	/// </param>
	/// <returns>
	/// True if a request is allowed; otherwise false.
	/// </returns>
	public Task<bool> CanMakeRequestAsync(
		string apiName,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Checks if an API call is allowed under the configured limit for the specified interval.
	/// </summary>
	/// <param name="apiName">
	/// The logical API name used to track quotas.
	/// </param>
	/// <param name="interval">
	/// The limit interval to check against (Daily or Monthly).
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token to cancel the operation.
	/// </param>
	/// <returns>
	/// True if a request is allowed; otherwise false.
	/// </returns>
	public Task<bool> CanMakeRequestAsync(
		string apiName,
		LimitInterval interval,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Attempts to increment the request count if under the limit.
	/// </summary>
	/// <param name="apiName">
	/// The logical API name used to track quotas.
	/// </param>
	/// <param name="baseUrl">
	/// The base URL of the endpoint (used for partitioning or logging).
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token to cancel the operation.
	/// </param>
	/// <returns>
	/// True if the increment succeeded; false if the limit would be exceeded.
	/// </returns>
	public Task<bool> TryIncrementRequestCountAsync(
		string apiName,
		string baseUrl,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets the current request count for the API's configured interval.
	/// </summary>
	/// <param name="apiName">
	/// The logical API name used to track quotas.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token to cancel the operation.
	/// </param>
	/// <returns>
	/// The total number of requests made in the current interval for the given API.
	/// </returns>
	public Task<int> GetRequestCountAsync(
		string apiName,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets the current request count for an API within the specified interval.
	/// </summary>
	/// <param name="apiName">
	/// The logical API name used to track quotas.
	/// </param>
	/// <param name="interval">
	/// The limit interval (Daily resets at midnight UTC, Monthly resets on 1st).
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token to cancel the operation.
	/// </param>
	/// <returns>
	/// Current request count for the interval.
	/// </returns>
	public Task<int> GetCurrentCountAsync(
		string apiName,
		LimitInterval interval,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets the remaining quota for the API's configured interval.
	/// </summary>
	/// <param name="apiName">
	/// The logical API name used to track quotas.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token to cancel the operation.
	/// </param>
	/// <returns>
	/// The number of requests remaining in the current interval.
	/// </returns>
	public Task<int> GetRemainingQuotaAsync(
		string apiName,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Time remaining until the rate limit resets.
	/// For daily limits: midnight UTC. For monthly limits: 1st of next month UTC.
	/// </summary>
	/// <returns>
	/// A TimeSpan representing the time until reset.
	/// </returns>
	public TimeSpan GetTimeUntilReset();

	/// <summary>
	/// Manually resets the counter for the specified API (testing/support only).
	/// </summary>
	/// <param name="apiName">
	/// The logical API name whose counter will be reset.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token to cancel the operation.
	/// </param>
	public Task ResetCounterAsync(
		string apiName,
		CancellationToken cancellationToken = default);
}