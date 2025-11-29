// <copyright file="RateLimitPolicies.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Configuration;

/// <summary>
/// Named rate limit policy constants for use with [EnableRateLimiting] attribute.
/// </summary>
/// <remarks>
/// Centralizes policy names to avoid magic strings across controllers.
/// Policies are configured in ServiceCollectionExtensions.AddConfiguredRateLimiting().
/// </remarks>
public static class RateLimitPolicies
{
	/// <summary>
	/// Strict rate limit for login attempts (5/minute per IP).
	/// </summary>
	public const string AuthLogin = "auth-login";

	/// <summary>
	/// Strict rate limit for registration attempts (3/hour per IP).
	/// </summary>
	public const string AuthRegister = "auth-register";

	/// <summary>
	/// Moderate rate limit for token refresh (10/minute per IP).
	/// </summary>
	public const string AuthRefresh = "auth-refresh";
}