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
/// </remarks>
public record CacheSettings
{
	/// <summary>
	/// Configuration section name in appsettings.json.
	/// </summary>
	public const string SECTION_NAME = "Cache";

	/// <summary>
	/// Valkey connection settings.
	/// </summary>
	public ValkeySettings Valkey { get; init; } =
		new();

	/// <summary>
	/// Default cache entry duration for unspecified caches.
	/// </summary>
	public TimeSpan DefaultDuration { get; init; } =
		TimeSpan.FromMinutes(5);

	/// <summary>
	/// Maximum duration to serve stale data during backend failures.
	/// </summary>
	public TimeSpan FailSafeMaxDuration { get; init; } =
		TimeSpan.FromHours(1);

	/// <summary>
	/// Throttle duration for background refresh attempts.
	/// </summary>
	public TimeSpan FailSafeThrottleDuration { get; init; } =
		TimeSpan.FromSeconds(30);

	/// <summary>
	/// Default key prefix for the default cache.
	/// </summary>
	/// <remarks>
	/// Prevents key collisions when using named caches. Convention: "cachename:".
	/// </remarks>
	public string DefaultKeyPrefix { get; init; } =
		"default:";

	/// <summary>
	/// Identity domain cache settings (short TTL for security-sensitive data).
	/// </summary>
	/// <remarks>
	/// Used for user profiles, roles, and authentication-related data.
	/// Shorter TTL ensures security changes propagate quickly.
	/// </remarks>
	public NamedCacheSettings Identity { get; init; } =
		new()
		{
			Duration =
				TimeSpan.FromMinutes(1),
			FailSafeMaxDuration =
				TimeSpan.FromMinutes(5),
			FailSafeThrottleDuration =
				TimeSpan.FromSeconds(10),
			KeyPrefix =
				"identity:",
		};

	/// <summary>
	/// Logging domain cache settings (longer TTL, read-heavy).
	/// </summary>
	/// <remarks>
	/// Used for log query results and aggregations.
	/// Longer TTL acceptable since logs are append-only.
	/// </remarks>
	public NamedCacheSettings Logging { get; init; } =
		new()
		{
			Duration =
				TimeSpan.FromMinutes(5),
			FailSafeMaxDuration =
				TimeSpan.FromHours(1),
			FailSafeThrottleDuration =
				TimeSpan.FromSeconds(30),
			KeyPrefix =
				"logging:",
		};

	/// <summary>
	/// API tracking domain cache settings.
	/// </summary>
	/// <remarks>
	/// Used for third-party API request tracking and limits.
	/// Moderate TTL balances freshness with performance.
	/// </remarks>
	public NamedCacheSettings ApiTracking { get; init; } =
		new()
		{
			Duration =
				TimeSpan.FromMinutes(5),
			FailSafeMaxDuration =
				TimeSpan.FromHours(1),
			FailSafeThrottleDuration =
				TimeSpan.FromSeconds(30),
			KeyPrefix =
				"apitracking:",
		};
}
