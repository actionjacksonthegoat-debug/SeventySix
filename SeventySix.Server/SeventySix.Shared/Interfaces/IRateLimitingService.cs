// <copyright file="IRateLimitingService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Interfaces;

/// <summary>API rate limiting service - tracks and enforces daily API call limits.</summary>
public interface IRateLimitingService
{
	/// <summary>
	/// Checks if an API call is allowed under the configured daily limit.
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
	/// Gets the current request count for today.
	/// </summary>
	/// <param name="apiName">
	/// The logical API name used to track quotas.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token to cancel the operation.
	/// </param>
	/// <returns>
	/// The total number of requests made today for the given API.
	/// </returns>
	public Task<int> GetRequestCountAsync(
		string apiName,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets the remaining quota for today.
	/// </summary>
	/// <param name="apiName">
	/// The logical API name used to track quotas.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token to cancel the operation.
	/// </param>
	/// <returns>
	/// The number of requests remaining for today.
	/// </returns>
	public Task<int> GetRemainingQuotaAsync(
		string apiName,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Time remaining until the daily rate limit resets (midnight UTC).
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