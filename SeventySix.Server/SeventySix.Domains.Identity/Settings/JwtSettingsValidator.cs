// <copyright file="JwtSettingsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity.Settings;

/// <summary>
/// FluentValidation validator for JwtSettings.
/// Ensures JWT configuration meets security requirements.
/// </summary>
/// <remarks>
/// Security Requirements:
/// - SecretKey: Minimum 32 characters (256 bits) for HS256 algorithm
/// - SecretKey: Must have sufficient entropy (10+ unique characters)
/// - SecretKey: Must not contain common weak patterns
/// - Issuer/Audience: Required for proper token validation
/// - Expiration: Bounded to prevent security issues
///
/// This validator is used at application startup to fail fast
/// if JWT configuration is invalid.
///
/// Reference: RFC 7518 (JSON Web Algorithms)
/// https://datatracker.ietf.org/doc/html/rfc7518#section-3.2
/// </remarks>
public sealed class JwtSettingsValidator : AbstractValidator<JwtSettings>
{
	/// <summary>
	/// Minimum required length for SecretKey (256 bits = 32 bytes/characters).
	/// </summary>
	public const int MinSecretKeyLength = 32;

	/// <summary>
	/// Minimum number of unique characters required in SecretKey for entropy.
	/// </summary>
	public const int MinUniqueCharacters = 10;

	/// <summary>
	/// Maximum allowed access token expiration in minutes.
	/// </summary>
	public const int MaxAccessTokenExpirationMinutes = 60;

	/// <summary>
	/// Maximum allowed refresh token expiration in days.
	/// </summary>
	public const int MaxRefreshTokenExpirationDays = 30;

	/// <summary>
	/// Common weak patterns that indicate non-random secrets.
	/// </summary>
	private static readonly string[] WeakPatterns =
		[
		"placeholder",
		"secret",
		"password",
		"changeme",
		"123456",
	];

	/// <summary>
	/// Initializes a new instance of the <see cref="JwtSettingsValidator"/> class.
	/// </summary>
	public JwtSettingsValidator()
	{
		RuleFor(settings => settings.SecretKey)
			.NotEmpty()
			.WithMessage("SecretKey is required")
			.MinimumLength(MinSecretKeyLength)
			.WithMessage(
				$"SecretKey must be at least {MinSecretKeyLength} characters (256 bits) for HS256")
			.Must(key => !IsWeakKey(key))
			.WithMessage(
				"SecretKey appears weak. Use cryptographically random 256-bit key.");

		RuleFor(settings => settings.Issuer)
			.NotEmpty()
			.WithMessage("Issuer is required");

		RuleFor(settings => settings.Audience)
			.NotEmpty()
			.WithMessage("Audience is required");

		RuleFor(settings => settings.AccessTokenExpirationMinutes)
			.InclusiveBetween(1, MaxAccessTokenExpirationMinutes)
			.WithMessage(
				$"AccessTokenExpirationMinutes must be between 1 and {MaxAccessTokenExpirationMinutes}");

		RuleFor(settings => settings.RefreshTokenExpirationDays)
			.InclusiveBetween(1, MaxRefreshTokenExpirationDays)
			.WithMessage(
				$"RefreshTokenExpirationDays must be between 1 and {MaxRefreshTokenExpirationDays}");

		RuleFor(settings => settings.ClockSkewMinutes)
			.InclusiveBetween(0, 5)
			.WithMessage("ClockSkewMinutes must be between 0 and 5");

		RuleFor(settings => settings.TokenRefreshBufferSeconds)
			.GreaterThan(0)
			.WithMessage("TokenRefreshBufferSeconds must be greater than 0");
	}

	/// <summary>
	/// Determines if a secret key appears weak based on entropy and common patterns.
	/// </summary>
	/// <param name="key">
	/// The secret key to evaluate.
	/// </param>
	/// <returns>
	/// True if the key appears weak; otherwise, false.
	/// </returns>
	private static bool IsWeakKey(string key)
	{
		if (string.IsNullOrEmpty(key))
		{
			return true;
		}

		// Reject if fewer than 10 unique characters (low entropy)
		if (key.Distinct().Count() < MinUniqueCharacters)
		{
			return true;
		}

		// Reject common weak patterns
		return WeakPatterns.Any(pattern =>
			key.Contains(
				pattern,
				StringComparison.OrdinalIgnoreCase));
	}
}