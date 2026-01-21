// <copyright file="RateLimitPartitionKeys.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Configuration;

/// <summary>
/// Partition key constants for rate limiting.
/// Single source of truth for rate limiter partition identifiers (DRY).
/// </summary>
public static class RateLimitPartitionKeys
{
	/// <summary>
	/// Partition for CORS preflight requests (no limits).
	/// </summary>
	public const string Preflight = "__preflight__";

	/// <summary>
	/// Partition for internal/health check requests (no limits).
	/// </summary>
	public const string Internal = "__internal__";

	/// <summary>
	/// Partition for unauthenticated requests.
	/// </summary>
	public const string Anonymous = "anonymous";
}
