// <copyright file="CacheSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Settings;

/// <summary>
/// Configuration settings for FusionCache with Valkey backend.
/// </summary>
/// <remarks>
/// Provides centralized cache configuration bound from appsettings.json "Cache" section.
/// Supports graceful degradation when Valkey is unavailable via fail-safe settings.
/// Named caches allow per-domain TTL and fail-safe configuration.
/// All durations MUST be configured in appsettings.json.
/// </remarks>
public sealed record CacheSettings
{
	/// <summary>
	/// Configuration section name in appsettings.json.
	/// </summary>
	public const string SectionName = "Cache";

	/// <summary>
	/// Valkey connection settings.
	/// </summary>
	public ValkeySettings Valkey { get; init; } =
		new();

	/// <summary>
	/// Default cache entry duration for unspecified caches.
	/// </summary>
	/// <remarks>
	/// Must be configured in appsettings.json.
	/// </remarks>
	public TimeSpan DefaultDuration { get; init; }

	/// <summary>
	/// Maximum duration to serve stale data during backend failures.
	/// </summary>
	/// <remarks>
	/// Must be configured in appsettings.json.
	/// </remarks>
	public TimeSpan FailSafeMaxDuration { get; init; }

	/// <summary>
	/// Throttle duration for background refresh attempts.
	/// </summary>
	/// <remarks>
	/// Must be configured in appsettings.json.
	/// </remarks>
	public TimeSpan FailSafeThrottleDuration { get; init; }

	/// <summary>
	/// Default key prefix for the default cache.
	/// </summary>
	/// <remarks>
	/// Prevents key collisions when using named caches. Convention: "cachename:".
	/// Must be configured in appsettings.json.
	/// </remarks>
	public string DefaultKeyPrefix { get; init; } =
		string.Empty;

	/// <summary>
	/// Identity domain cache settings (short TTL for security-sensitive data).
	/// </summary>
	/// <remarks>
	/// Used for user profiles, roles, and authentication-related data.
	/// Shorter TTL ensures security changes propagate quickly.
	/// </remarks>
	public NamedCacheSettings Identity { get; init; } =
		new();

	/// <summary>
	/// Logging domain cache settings (longer TTL, read-heavy).
	/// </summary>
	/// <remarks>
	/// Used for log query results and aggregations.
	/// Longer TTL acceptable since logs are append-only.
	/// </remarks>
	public NamedCacheSettings Logging { get; init; } =
		new();

	/// <summary>
	/// API tracking domain cache settings.
	/// </summary>
	/// <remarks>
	/// Used for third-party API request tracking and limits.
	/// Moderate TTL balances freshness with performance.
	/// </remarks>
	public NamedCacheSettings ApiTracking { get; init; } =
		new();
}