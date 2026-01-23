// <copyright file="RateLimitingSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Configuration;

/// <summary>
/// Configuration settings for rate limiting.
/// Bound from appsettings.json "RateLimiting" section.
/// </summary>
public sealed record RateLimitingSettings
{
	/// <summary>
	/// Gets the maximum number of requests allowed per window.
	/// Default: 2500 requests per hour.
	/// </summary>
	public int PermitLimit { get; init; } = 2500;

	/// <summary>
	/// Gets the time window in seconds.
	/// </summary>
	public int WindowSeconds { get; init; } = 3600;

	/// <summary>
	/// Gets the retry-after header value in seconds.
	/// </summary>
	public int RetryAfterSeconds { get; init; } = 60;

	/// <summary>
	/// Gets a value indicating whether rate limiting is enabled globally.
	/// </summary>
	public bool Enabled { get; init; } = true;
}