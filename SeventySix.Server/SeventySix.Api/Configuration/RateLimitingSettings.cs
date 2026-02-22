// <copyright file="RateLimitingSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Configuration;

/// <summary>
/// Configuration settings for rate limiting.
/// Bound from appsettings.json "RateLimiting" section.
/// </summary>
/// <remarks>
/// All numeric properties must be configured in appsettings.json.
/// Application will fail to start if required values are missing.
/// </remarks>
public sealed record RateLimitingSettings
{
	/// <summary>
	/// Configuration section name for binding.
	/// </summary>
	public const string SectionName = "RateLimiting";

	/// <summary>
	/// Gets the maximum number of requests allowed per window.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int PermitLimit { get; init; }

	/// <summary>
	/// Gets the time window in seconds.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int WindowSeconds { get; init; }

	/// <summary>
	/// Gets the retry-after header value in seconds.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int RetryAfterSeconds { get; init; }

	/// <summary>
	/// Gets a value indicating whether rate limiting is enabled globally.
	/// </summary>
	public bool Enabled { get; init; } = true;

	/// <summary>
	/// Gets health endpoint rate limiting configuration.
	/// </summary>
	public HealthRateLimitSettings Health { get; init; } =
		new();
}

/// <summary>
/// Rate limiting settings for health endpoints.
/// Bound from appsettings.json "RateLimiting:Health" section.
/// </summary>
/// <remarks>
/// Health endpoints are public and require rate limiting to prevent DDOS attacks.
/// </remarks>
public sealed record HealthRateLimitSettings
{
	/// <summary>
	/// Gets the maximum health check requests per window.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int PermitLimit { get; init; }

	/// <summary>
	/// Gets the rate limit window in seconds.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int WindowSeconds { get; init; }
}