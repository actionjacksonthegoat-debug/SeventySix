// <copyright file="HealthRateLimitSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Configuration;

/// <summary>
/// Configuration settings for health endpoint rate limiting.
/// Bound from appsettings.json "RateLimiting:Health" section.
/// </summary>
/// <remarks>
/// Health endpoints are public and require rate limiting to prevent DDOS attacks.
/// Default: 30 requests per minute per IP address.
/// </remarks>
public sealed record HealthRateLimitSettings
{
	/// <summary>
	/// Gets the maximum number of health check requests per window.
	/// Default: 30.
	/// </summary>
	public int PermitLimit { get; init; } = 30;

	/// <summary>
	/// Gets the rate limit window in seconds.
	/// Default: 60 (1 minute).
	/// </summary>
	public int WindowSeconds { get; init; } = 60;
}