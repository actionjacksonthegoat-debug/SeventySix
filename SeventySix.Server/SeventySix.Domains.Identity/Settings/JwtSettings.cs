// <copyright file="JwtSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Security.Cryptography;
using System.Text;

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

	/// <summary>
	/// Gets the key identifier used in the JWT kid header.
	/// Identifies which signing key was used — required for graceful key rotation.
	/// If not set, defaults to a deterministic SHA256 fingerprint of <see cref="SecretKey"/>.
	/// </summary>
	public string? KeyId { get; init; }

	/// <summary>
	/// Gets the previous secret key accepted during a key rotation window.
	/// Set this to the old <see cref="SecretKey"/> value when rotating to a new key.
	/// Unset after all tokens signed with the previous key have expired.
	/// </summary>
	public string? PreviousSecretKey { get; init; }

	/// <summary>
	/// Gets the key identifier matching the kid header of tokens signed with <see cref="PreviousSecretKey"/>.
	/// If not set and <see cref="PreviousSecretKey"/> is configured, defaults to a fingerprint
	/// of <see cref="PreviousSecretKey"/>.
	/// </summary>
	public string? PreviousKeyId { get; init; }

	/// <summary>
	/// Gets the effective key identifier for the current secret key.
	/// Returns <see cref="KeyId"/> when configured; otherwise computes a SHA256 fingerprint.
	/// </summary>
	/// <returns>
	/// The effective key identifier string.
	/// </returns>
	public string GetEffectiveKeyId() =>
		string.IsNullOrEmpty(KeyId)
			? ComputeKeyFingerprint(SecretKey)
			: KeyId;

	/// <summary>
	/// Computes a short, stable key identifier from a secret key.
	/// Takes the first 8 base64url characters of the SHA256 hash of the key bytes.
	/// </summary>
	/// <param name="secretKey">
	/// The secret key to fingerprint.
	/// </param>
	/// <returns>
	/// An 8-character base64url string uniquely identifying the key.
	/// </returns>
	public static string ComputeKeyFingerprint(string secretKey)
	{
		byte[] hash =
			SHA256.HashData(
				Encoding.UTF8.GetBytes(secretKey));

		return Convert.ToBase64String(hash)
			.Replace('+', '-')
			.Replace('/', '_')
			.TrimEnd('=')[..8];
	}
}