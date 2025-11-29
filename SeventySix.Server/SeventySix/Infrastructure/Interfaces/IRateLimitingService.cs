// <copyright file="IRateLimitingService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared;

/// <summary>API rate limiting service - tracks and enforces daily API call limits.</summary>
public interface IRateLimitingService
{
	/// <summary>Checks if API call is allowed under daily limit.</summary>
	public Task<bool> CanMakeRequestAsync(string apiName, CancellationToken cancellationToken = default);

	/// <summary>Increments request count if under limit.</summary>
	public Task<bool> TryIncrementRequestCountAsync(string apiName, string baseUrl, CancellationToken cancellationToken = default);

	/// <summary>Gets current request count for today.</summary>
	public Task<int> GetRequestCountAsync(string apiName, CancellationToken cancellationToken = default);

	/// <summary>Gets remaining quota for today.</summary>
	public Task<int> GetRemainingQuotaAsync(string apiName, CancellationToken cancellationToken = default);

	/// <summary>Time until rate limit resets (midnight UTC).</summary>
	public TimeSpan GetTimeUntilReset();

	/// <summary>Manually resets counter (testing only).</summary>
	public Task ResetCounterAsync(string apiName, CancellationToken cancellationToken = default);
}