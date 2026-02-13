// <copyright file="OutputCacheOptions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Configuration;

/// <summary>
/// Configuration options for ASP.NET Core Output Caching.
/// </summary>
/// <remarks>
/// Provides centralized configuration for cache policies.
/// Maps to "Cache:OutputCache" section in appsettings.json.
/// Follows Options Pattern for strongly-typed configuration.
/// </remarks>
public record OutputCacheOptions
{
	/// <summary>
	/// Configuration section name.
	/// </summary>
	public const string SectionName = "Cache:OutputCache";

	/// <summary>
	/// Gets the cache policies.
	/// Key is the policy name (e.g., "Users", "Logs").
	/// Value is the policy configuration.
	/// </summary>
	public Dictionary<string, CachePolicyConfig> Policies { get; init; } = [];
}

/// <summary>
/// Configuration for a single cache policy.
/// </summary>
public record CachePolicyConfig
{
	/// <summary>
	/// Gets the cache duration in seconds.
	/// </summary>
	public int DurationSeconds { get; init; }

	/// <summary>
	/// Gets the query string parameters that vary the cache.
	/// Each unique combination of these parameters creates a separate cache entry.
	/// </summary>
	public string[] VaryByQuery { get; init; } = [];

	/// <summary>
	/// Gets the cache tag for invalidation.
	/// Multiple policies can share the same tag for coordinated invalidation.
	/// </summary>
	public string Tag { get; init; } = string.Empty;

	/// <summary>
	/// Gets a value indicating whether this policy is enabled.
	/// Useful for disabling caching in development environments.
	/// </summary>
	public bool Enabled { get; init; } = true;
}