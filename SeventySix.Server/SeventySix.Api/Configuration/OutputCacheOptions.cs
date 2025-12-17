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
public class OutputCacheOptions
{
	/// <summary>
	/// Configuration section name.
	/// </summary>
	public const string SECTION_NAME = "Cache:OutputCache";

	/// <summary>
	/// Gets or sets the cache policies.
	/// Key is the policy name (e.g., "Users", "Logs").
	/// Value is the policy configuration.
	/// </summary>
	public Dictionary<string, CachePolicyConfig> Policies { get; set; } = [];
}

/// <summary>
/// Configuration for a single cache policy.
/// </summary>
public class CachePolicyConfig
{
	/// <summary>
	/// Gets or sets the cache duration in seconds.
	/// </summary>
	public int DurationSeconds { get; set; }

	/// <summary>
	/// Gets or sets the query string parameters that vary the cache.
	/// Each unique combination of these parameters creates a separate cache entry.
	/// </summary>
	public string[] VaryByQuery { get; set; } = [];

	/// <summary>
	/// Gets or sets the cache tag for invalidation.
	/// Multiple policies can share the same tag for coordinated invalidation.
	/// </summary>
	public string Tag { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets a value indicating whether this policy is enabled.
	/// Useful for disabling caching in development environments.
	/// </summary>
	public bool Enabled { get; set; } = true;
}