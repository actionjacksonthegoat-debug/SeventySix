// <copyright file="CacheNames.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Constants;

/// <summary>
/// Named cache constants for domain isolation.
/// </summary>
/// <remarks>
/// Each domain uses a separate named cache to:
/// - Prevent key collisions between domains
/// - Allow domain-specific TTL and fail-safe configurations
/// - Enable targeted cache invalidation per domain
/// </remarks>
public static class CacheNames
{
	/// <summary>
	/// Default cache for shared/general use.
	/// </summary>
	public const string Default = "Default";

	/// <summary>
	/// Identity domain cache for OAuth tokens and user sessions.
	/// </summary>
	/// <remarks>
	/// Short TTL (1 minute) for security-sensitive data.
	/// </remarks>
	public const string Identity = "Identity";

	/// <summary>
	/// Logging domain cache for log entries and filters.
	/// </summary>
	/// <remarks>
	/// Longer TTL (5 minutes) for read-heavy log queries.
	/// </remarks>
	public const string Logging = "Logging";

	/// <summary>
	/// API tracking domain cache for third-party request metrics.
	/// </summary>
	/// <remarks>
	/// Standard TTL (5 minutes) for dashboard queries.
	/// </remarks>
	public const string ApiTracking = "ApiTracking";
}