// <copyright file="RateLimitPolicyNames.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Configuration;

/// <summary>
/// Constants for rate limiting policy names used in the API layer.
/// </summary>
/// <remarks>
/// These constants are used to identify non-auth rate limiting policies
/// applied through <see cref="Microsoft.AspNetCore.RateLimiting.EnableRateLimitingAttribute"/>.
/// Auth-related policies are in <c>SeventySix.Identity.RateLimitPolicyConstants</c>.
/// </remarks>
public static class RateLimitPolicyNames
{
	/// <summary>
	/// Policy name for health check endpoint rate limiting.
	/// Applied to /health/* endpoints.
	/// </summary>
	public const string HealthCheck = "HealthCheck";
}
