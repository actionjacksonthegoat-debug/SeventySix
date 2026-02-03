// <copyright file="NamedCacheSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Settings;

/// <summary>
/// Configuration settings for a named FusionCache instance.
/// </summary>
/// <remarks>
/// Each bounded context can have its own cache with specific TTL and fail-safe settings.
/// The KeyPrefix should match the cache name to prevent key collisions.
/// All values MUST be configured in appsettings.json.
/// </remarks>
public record NamedCacheSettings
{
	/// <summary>
	/// Cache entry duration (TTL) for this named cache.
	/// </summary>
	/// <remarks>
	/// Security-sensitive caches (Identity) should use shorter durations.
	/// Read-heavy caches (Logging, ApiTracking) can use longer durations.
	/// Must be configured in appsettings.json.
	/// </remarks>
	public TimeSpan Duration { get; init; }

	/// <summary>
	/// Maximum duration to serve stale data during backend failures.
	/// </summary>
	/// <remarks>
	/// Fail-safe serves stale cached data when the backend (Valkey) is unavailable.
	/// Should be longer than Duration to provide resilience during outages.
	/// Must be configured in appsettings.json.
	/// </remarks>
	public TimeSpan FailSafeMaxDuration { get; init; }

	/// <summary>
	/// Throttle duration for background refresh attempts.
	/// </summary>
	/// <remarks>
	/// Limits how frequently FusionCache attempts to refresh stale entries.
	/// Prevents overwhelming the backend during recovery from failures.
	/// Must be configured in appsettings.json.
	/// </remarks>
	public TimeSpan FailSafeThrottleDuration { get; init; }

	/// <summary>
	/// Prefix for all cache keys in this named cache.
	/// </summary>
	/// <remarks>
	/// Required to prevent key collisions between named caches.
	/// Convention: lowercase cache name followed by colon (e.g., "identity:", "logging:").
	/// Must be configured in appsettings.json.
	/// </remarks>
	public string KeyPrefix { get; init; } =
		string.Empty;
}