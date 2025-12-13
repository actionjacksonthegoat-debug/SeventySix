// <copyright file="RateLimitPolicyConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Named rate limit policy constants for authentication endpoints.
/// Use with [EnableRateLimiting] attribute on auth controllers.
/// </summary>
/// <remarks>
/// Centralizes policy names to avoid magic strings across controllers.
/// Policies are configured in ServiceCollectionExtensions.AddConfiguredRateLimiting().
/// </remarks>
public static class RateLimitPolicyConstants
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