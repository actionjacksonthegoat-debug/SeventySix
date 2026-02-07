// <copyright file="JwtConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity.Constants;

/// <summary>
/// Constants for JWT token configuration and validation.
/// Single source of truth for JWT-related magic numbers (DRY).
/// </summary>
public static class JwtConstants
{
	/// <summary>
	/// Minimum secret key length in bytes (256 bits for HS256).
	/// </summary>
	public const int MinimumSecretKeyLengthBytes = 32;

	/// <summary>
	/// Default clock skew tolerance in minutes.
	/// </summary>
	public const int DefaultClockSkewMinutes = 1;

	/// <summary>
	/// Maximum allowed access token lifetime in hours.
	/// </summary>
	public const int MaxAccessTokenLifetimeHours = 24;

	/// <summary>
	/// Maximum allowed refresh token lifetime in days.
	/// </summary>
	public const int MaxRefreshTokenLifetimeDays = 90;
}