// <copyright file="JwtSettingsValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Identity;
using SeventySix.Identity.Settings;

namespace SeventySix.Identity.Tests.Validators;

/// <summary>
/// Unit tests for JwtSettingsValidator.
/// Validates JWT configuration security requirements.
/// </summary>
/// <remarks>
/// Security Requirements:
/// - SecretKey must be at least 32 characters (256 bits) for HS256
/// - Issuer and Audience should be configured for production
/// - Token expiration values should be within reasonable bounds
///
/// Test Pattern: MethodName_ExpectedBehavior_WhenCondition
/// </remarks>
public class JwtSettingsValidatorTests
{
	/// <summary>
	/// High-entropy test key with 10+ unique characters for tests requiring valid keys.
	/// </summary>
	private const string ValidTestSecretKey =
		"Kj8#mP2$vN5@xQ9&wL4*hR7!cT3^bF6%";

	private const string TestIssuer = "https://test.com";
	private const string TestAudience = "https://test.com";

	private readonly JwtSettingsValidator Validator = new();

	/// <summary>
	/// Creates a valid JwtSettings instance with optional overrides.
	/// </summary>
	private static JwtSettings CreateValidSettings(
		string? secretKey = null,
		string? issuer = null,
		string? audience = null,
		int? accessTokenMinutes = null,
		int? refreshTokenDays = null,
		int? clockSkewMinutes = null) =>
		new()
		{
			SecretKey =
				secretKey ?? ValidTestSecretKey,
			Issuer =
				issuer ?? TestIssuer,
			Audience =
				audience ?? TestAudience,
			AccessTokenExpirationMinutes =
				accessTokenMinutes ?? 15,
			RefreshTokenExpirationDays =
				refreshTokenDays ?? 7,
			ClockSkewMinutes =
				clockSkewMinutes ?? 1,
		};

	#region SecretKey Validation Tests

	[Theory]
	[InlineData("", "empty")]
	[InlineData("short", "too short")]
	public void Validate_ReturnsFailure_WhenSecretKeyInvalid(
		string secretKey,
		string reason)
	{
		// Arrange
		JwtSettings settings =
			CreateValidSettings(secretKey: secretKey);

		// Act
		TestValidationResult<JwtSettings> result =
			Validator.TestValidate(
			settings);

		// Assert
		result.ShouldHaveValidationErrorFor(s => s.SecretKey);
		_ = reason; // Used for test name readability
	}

	[Fact]
	public void Validate_ReturnsFailure_WhenSecretKeyTooShort_WithSpecificMessage()
	{
		// Arrange
		JwtSettings settings =
			CreateValidSettings(
			secretKey: new string('x', 31));

		// Act
		TestValidationResult<JwtSettings> result =
			Validator.TestValidate(
			settings);

		// Assert
		result
			.ShouldHaveValidationErrorFor(s => s.SecretKey)
			.WithErrorMessage(
				"SecretKey must be at least 32 characters (256 bits) for HS256");
	}

	[Theory]
	[InlineData("Kj8#mP2$vN5@xQ9&wL4*hR7!cT3^bF6%")] // Exactly 32 chars, high entropy
	[InlineData(
		"Kj8#mP2$vN5@xQ9&wL4*hR7!cT3^bF6%Kj8#mP2$vN5@xQ9&wL4*hR7!cT3^bF6%"
	)] // 64 chars
	[InlineData("aB3$cD4%eF5^gH6&iJ7*kL8!mN9@oP0#")] // Different high entropy pattern
	public void Validate_ReturnsSuccess_WhenSecretKeyValid(string secretKey)
	{
		// Arrange
		JwtSettings settings =
			CreateValidSettings(secretKey: secretKey);

		// Act
		TestValidationResult<JwtSettings> result =
			Validator.TestValidate(
			settings);

		// Assert
		result.ShouldNotHaveValidationErrorFor(s => s.SecretKey);
	}

	#endregion

	#region SecretKey Entropy Validation Tests

	[Theory]
	[InlineData("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")] // 32 same chars - no entropy
	[InlineData("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")] // 32 same chars uppercase
	[InlineData("12345678901234567890123456789012")] // Sequential digits
	[InlineData("abcdefghiabcdefghiabcdefghiabc")] // <10 unique chars (padded to 32)
	public void Validate_ReturnsFailure_WhenSecretKeyLowEntropy(string weakKey)
	{
		// Arrange - Pad to 32 chars if needed
		string paddedKey =
			weakKey.Length < 32
			? weakKey.PadRight(
				32,
				weakKey[0])
			: weakKey;

		JwtSettings settings =
			CreateValidSettings(secretKey: paddedKey);

		// Act
		TestValidationResult<JwtSettings> result =
			Validator.TestValidate(
			settings);

		// Assert
		result
			.ShouldHaveValidationErrorFor(s => s.SecretKey)
			.WithErrorMessage(
				"SecretKey appears weak. Use cryptographically random 256-bit key.");
	}

	[Theory]
	[InlineData("PLACEHOLDER_USE_USER_SECRETS_MIN")] // Contains "placeholder"
	[InlineData("my-super-secret-key-for-jwt-min!")] // Contains "secret"
	[InlineData("password123456789012345678901234")] // Contains "password"
	[InlineData("changeme-changeme-changeme-12345")] // Contains "changeme"
	public void Validate_ReturnsFailure_WhenSecretKeyContainsWeakPatterns(
		string weakKey)
	{
		// Arrange
		JwtSettings settings =
			CreateValidSettings(secretKey: weakKey);

		// Act
		TestValidationResult<JwtSettings> result =
			Validator.TestValidate(
			settings);

		// Assert
		result
			.ShouldHaveValidationErrorFor(s => s.SecretKey)
			.WithErrorMessage(
				"SecretKey appears weak. Use cryptographically random 256-bit key.");
	}

	#endregion

	#region Issuer and Audience Validation Tests

	[Theory]
	[InlineData("", null, "Issuer")]
	[InlineData(null, "", "Audience")]
	public void Validate_ReturnsFailure_WhenRequiredFieldEmpty(
		string? issuer,
		string? audience,
		string fieldName)
	{
		// Arrange
		JwtSettings settings =
			CreateValidSettings(
			issuer: issuer ?? TestIssuer,
			audience: audience ?? TestAudience);

		// Act
		TestValidationResult<JwtSettings> result =
			Validator.TestValidate(
			settings);

		// Assert
		if (fieldName == "Issuer")
		{
			result
				.ShouldHaveValidationErrorFor(s => s.Issuer)
				.WithErrorMessage("Issuer is required");
		}
		else
		{
			result
				.ShouldHaveValidationErrorFor(s => s.Audience)
				.WithErrorMessage("Audience is required");
		}
	}

	[Theory]
	[InlineData("https://api.seventysix.com", "https://app.seventysix.com")]
	[InlineData("SeventySix.Api", "SeventySix.Client")]
	public void Validate_ReturnsSuccess_WhenIssuerAndAudienceProvided(
		string issuer,
		string audience)
	{
		// Arrange
		JwtSettings settings =
			CreateValidSettings(
			issuer: issuer,
			audience: audience);

		// Act
		TestValidationResult<JwtSettings> result =
			Validator.TestValidate(
			settings);

		// Assert
		result.ShouldNotHaveValidationErrorFor(s => s.Issuer);
		result.ShouldNotHaveValidationErrorFor(s => s.Audience);
	}

	#endregion

	#region Token Expiration Validation Tests

	[Theory]
	[InlineData(0, "AccessTokenExpirationMinutes")]
	[InlineData(-5, "AccessTokenExpirationMinutes")]
	[InlineData(61, "AccessTokenExpirationMinutes")]
	public void Validate_ReturnsFailure_WhenAccessTokenExpirationInvalid(
		int minutes,
		string fieldName)
	{
		// Arrange
		JwtSettings settings =
			CreateValidSettings(accessTokenMinutes: minutes);

		// Act
		TestValidationResult<JwtSettings> result =
			Validator.TestValidate(
			settings);

		// Assert
		result.ShouldHaveValidationErrorFor(s =>
			s.AccessTokenExpirationMinutes);
		_ = fieldName; // Used for test name readability
	}

	[Theory]
	[InlineData(1)]
	[InlineData(15)]
	[InlineData(30)]
	[InlineData(60)]
	public void Validate_ReturnsSuccess_WhenAccessTokenExpirationValid(
		int minutes)
	{
		// Arrange
		JwtSettings settings =
			CreateValidSettings(accessTokenMinutes: minutes);

		// Act
		TestValidationResult<JwtSettings> result =
			Validator.TestValidate(
			settings);

		// Assert
		result.ShouldNotHaveValidationErrorFor(s =>
			s.AccessTokenExpirationMinutes);
	}

	[Theory]
	[InlineData(0)]
	[InlineData(-1)]
	[InlineData(31)]
	public void Validate_ReturnsFailure_WhenRefreshTokenExpirationInvalid(
		int days)
	{
		// Arrange
		JwtSettings settings =
			CreateValidSettings(refreshTokenDays: days);

		// Act
		TestValidationResult<JwtSettings> result =
			Validator.TestValidate(
			settings);

		// Assert
		result.ShouldHaveValidationErrorFor(s => s.RefreshTokenExpirationDays);
	}

	[Theory]
	[InlineData(1)]
	[InlineData(7)]
	[InlineData(14)]
	[InlineData(30)]
	public void Validate_ReturnsSuccess_WhenRefreshTokenExpirationValid(
		int days)
	{
		// Arrange
		JwtSettings settings =
			CreateValidSettings(refreshTokenDays: days);

		// Act
		TestValidationResult<JwtSettings> result =
			Validator.TestValidate(
			settings);

		// Assert
		result.ShouldNotHaveValidationErrorFor(s =>
			s.RefreshTokenExpirationDays);
	}

	#endregion

	#region Full Validation Tests

	[Fact]
	public void Validate_ReturnsNoErrors_WhenAllSettingsValid()
	{
		// Arrange
		JwtSettings settings =
			CreateValidSettings(
			issuer: "https://api.seventysix.com",
			audience: "https://app.seventysix.com");

		// Act
		TestValidationResult<JwtSettings> result =
			Validator.TestValidate(
			settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_ReturnsMultipleErrors_WhenMultipleSettingsInvalid()
	{
		// Arrange
		JwtSettings settings =
			new()
			{
				SecretKey = "short",
				Issuer = string.Empty,
				Audience = string.Empty,
				AccessTokenExpirationMinutes = 0,
				RefreshTokenExpirationDays = 0,
				ClockSkewMinutes = -1,
			};

		// Act
		TestValidationResult<JwtSettings> result =
			Validator.TestValidate(
			settings);

		// Assert
		result.ShouldHaveValidationErrorFor(s => s.SecretKey);
		result.ShouldHaveValidationErrorFor(s => s.Issuer);
		result.ShouldHaveValidationErrorFor(s => s.Audience);
		result.ShouldHaveValidationErrorFor(s =>
			s.AccessTokenExpirationMinutes);
		result.ShouldHaveValidationErrorFor(s => s.RefreshTokenExpirationDays);
		result.ShouldHaveValidationErrorFor(s => s.ClockSkewMinutes);
	}

	#endregion

	#region ClockSkewMinutes Validation Tests

	[Theory]
	[InlineData(0)]
	[InlineData(1)]
	[InlineData(5)]
	public void Validate_ReturnsSuccess_WhenClockSkewMinutesValid(
		int clockSkewMinutes)
	{
		// Arrange
		JwtSettings settings =
			CreateValidSettings(clockSkewMinutes: clockSkewMinutes);

		// Act
		TestValidationResult<JwtSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveValidationErrorFor(settings => settings.ClockSkewMinutes);
	}

	[Theory]
	[InlineData(-1)]
	[InlineData(6)]
	[InlineData(10)]
	public void Validate_ReturnsFailure_WhenClockSkewMinutesOutOfRange(
		int clockSkewMinutes)
	{
		// Arrange
		JwtSettings settings =
			CreateValidSettings(clockSkewMinutes: clockSkewMinutes);

		// Act
		TestValidationResult<JwtSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result
			.ShouldHaveValidationErrorFor(settings => settings.ClockSkewMinutes)
			.WithErrorMessage("ClockSkewMinutes must be between 0 and 5");
	}

	#endregion
}