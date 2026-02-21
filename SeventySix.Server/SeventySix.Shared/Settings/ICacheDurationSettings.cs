// <copyright file="ICacheDurationSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Settings;

/// <summary>
/// Shared abstraction for cache settings that provide duration information.
/// Enables a single <c>CreateEntryOptions</c> method for all cache types.
/// </summary>
/// <remarks>
/// Implemented by <see cref="CacheSettings"/> (via <see cref="CacheSettings.DefaultDuration"/>)
/// and <see cref="NamedCacheSettings"/> (via its <c>Duration</c> property).
/// </remarks>
public interface ICacheDurationSettings
{
	/// <summary>
	/// Gets the cache entry duration (TTL).
	/// </summary>
	public TimeSpan Duration { get; }

	/// <summary>
	/// Gets the maximum duration to serve stale data during backend failures.
	/// </summary>
	public TimeSpan FailSafeMaxDuration { get; }

	/// <summary>
	/// Gets the throttle duration for background refresh attempts.
	/// </summary>
	public TimeSpan FailSafeThrottleDuration { get; }
}