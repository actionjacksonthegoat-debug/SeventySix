// <copyright file="JwtSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared;

/// <summary>
/// JWT configuration settings.
/// Used by Authentication context for token generation and validation.
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
	public int AccessTokenExpirationMinutes { get; init; } = 15;

	/// <summary>
	/// Gets refresh token expiration in days. Default: 7.
	/// </summary>
	public int RefreshTokenExpirationDays { get; init; } = 7;
}