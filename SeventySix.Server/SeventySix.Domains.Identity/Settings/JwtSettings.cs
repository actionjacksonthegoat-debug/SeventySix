// <copyright file="JwtSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// JWT configuration settings.
/// Used by Identity context for token generation and validation.
/// All values MUST be configured in appsettings.json.
/// </summary>
public sealed record JwtSettings
{
	/// <summary>
	/// Configuration section name for binding.
	/// </summary>
	public const string SectionName = "Jwt";

	/// <summary>
	/// Gets the secret key for signing tokens.
	/// </summary>
	public string SecretKey { get; init; } = string.Empty;

	/// <summary>
	/// Gets the token issuer.
	/// </summary>
	public string Issuer { get; init; } = string.Empty;

	/// <summary>
	/// Gets the token audience.
	/// </summary>
	public string Audience { get; init; } = string.Empty;

	/// <summary>
	/// Gets access token expiration in minutes.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int AccessTokenExpirationMinutes { get; init; }

	/// <summary>
	/// Gets refresh token expiration when "Remember Me" is NOT checked.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int RefreshTokenExpirationDays { get; init; }

	/// <summary>
	/// Gets refresh token expiration when "Remember Me" IS checked.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int RefreshTokenRememberMeExpirationDays { get; init; }

	/// <summary>
	/// Gets absolute session timeout regardless of activity.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int AbsoluteSessionTimeoutDays { get; init; }

	/// <summary>
	/// Gets the clock skew allowance in minutes for token validation.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int ClockSkewMinutes { get; init; }

	/// <summary>
	/// Gets the number of seconds before access token expiry at which the client
	/// should proactively refresh the token. Published to the client via ConfigController.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int TokenRefreshBufferSeconds { get; init; }
}