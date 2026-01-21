// <copyright file="JwtSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Identity.Constants;

namespace SeventySix.Identity;

/// <summary>
/// JWT configuration settings.
/// Used by Identity context for token generation and validation.
/// </summary>
public record JwtSettings
{
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
	/// Gets access token expiration in minutes. Default: 15.
	/// </summary>
	public int AccessTokenExpirationMinutes { get; init; } =
		JwtConstants.DefaultAccessTokenExpirationMinutes;

	/// <summary>
	/// Gets refresh token expiration when "Remember Me" is NOT checked. Default: 1 day.
	/// </summary>
	public int RefreshTokenExpirationDays { get; init; } =
		JwtConstants.DefaultRefreshTokenExpirationDays;

	/// <summary>
	/// Gets refresh token expiration when "Remember Me" IS checked. Default: 14 days.
	/// </summary>
	public int RefreshTokenRememberMeExpirationDays { get; init; } =
		JwtConstants.DefaultRefreshTokenRememberMeExpirationDays;

	/// <summary>
	/// Gets absolute session timeout regardless of activity. Default: 30 days.
	/// </summary>
	public int AbsoluteSessionTimeoutDays { get; init; } =
		JwtConstants.DefaultAbsoluteSessionTimeoutDays;
}