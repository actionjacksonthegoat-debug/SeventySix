// <copyright file="IRateLimitingService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared;

/// <summary>API rate limiting service - tracks and enforces daily API call limits.</summary>
public interface IRateLimitingService
{
	/// <summary>Checks if API call is allowed under daily limit.</summary>
	Task<bool> CanMakeRequestAsync(string apiName, CancellationToken cancellationToken = default);

	/// <summary>Increments request count if under limit.</summary>
	Task<bool> TryIncrementRequestCountAsync(string apiName, string baseUrl, CancellationToken cancellationToken = default);

	/// <summary>Gets current request count for today.</summary>
	Task<int> GetRequestCountAsync(string apiName, CancellationToken cancellationToken = default);

	/// <summary>Gets remaining quota for today.</summary>
	Task<int> GetRemainingQuotaAsync(string apiName, CancellationToken cancellationToken = default);

	/// <summary>Time until rate limit resets (midnight UTC).</summary>
	TimeSpan GetTimeUntilReset();

	/// <summary>Manually resets counter (testing only).</summary>
	Task ResetCounterAsync(string apiName, CancellationToken cancellationToken = default);
}
