// <copyright file="JwtSettingsValidatorUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Identity;
using SeventySix.Identity.Settings;

namespace SeventySix.Domains.Identity.Tests.Validators;

/// <summary>
/// Unit tests for JwtSettingsValidator.
/// </summary>
public sealed class JwtSettingsValidatorUnitTests
{
	private readonly JwtSettingsValidator Validator = new();

	[Fact]
	public void Validate_ValidSettings_PassesValidation()
	{
		// Arrange
		JwtSettings settings =
			CreateValidSettings();

		// Act
		TestValidationResult<JwtSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_EmptySecretKey_FailsValidation()
	{
		// Arrange
		JwtSettings settings =
			CreateValidSettings() with { SecretKey = string.Empty };

		// Act
		TestValidationResult<JwtSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			jwt => jwt.SecretKey);
	}

	[Fact]
	public void Validate_EmptyIssuer_FailsValidation()
	{
		// Arrange
		JwtSettings settings =
			CreateValidSettings() with { Issuer = string.Empty };

		// Act
		TestValidationResult<JwtSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			jwt => jwt.Issuer);
	}

	[Fact]
	public void Validate_ZeroAccessTokenExpiration_FailsValidation()
	{
		// Arrange
		JwtSettings settings =
			CreateValidSettings() with { AccessTokenExpirationMinutes = 0 };

		// Act
		TestValidationResult<JwtSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			jwt => jwt.AccessTokenExpirationMinutes);
	}

	[Fact]
	public void Validate_ZeroRefreshTokenExpirationDays_FailsValidation()
	{
		// Arrange
		JwtSettings settings =
			CreateValidSettings() with { RefreshTokenExpirationDays = 0 };

		// Act
		TestValidationResult<JwtSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			jwt => jwt.RefreshTokenExpirationDays);
	}

	private static JwtSettings CreateValidSettings() =>
		new()
		{
			SecretKey = "xK7mQ2pWvN8jR4tY6uH9bE3dF5gA1cZ0iL8oS2wX4nM7qJ6kR9pT3uV5yB",
			Issuer = "https://test.local",
			Audience = "https://test.local",
			AccessTokenExpirationMinutes = 15,
			RefreshTokenExpirationDays = 7,
			RefreshTokenRememberMeExpirationDays = 30,
			AbsoluteSessionTimeoutDays = 90,
			ClockSkewMinutes = 2,
		};
}
