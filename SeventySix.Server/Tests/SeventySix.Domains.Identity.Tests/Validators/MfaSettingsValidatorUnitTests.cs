// <copyright file="MfaSettingsValidatorUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Identity;

namespace SeventySix.Domains.Identity.Tests.Validators;

/// <summary>
/// Unit tests for MfaSettingsValidator.
/// </summary>
public sealed class MfaSettingsValidatorUnitTests
{
	private readonly MfaSettingsValidator Validator = new();

	[Fact]
	public void Validate_ValidSettings_PassesValidation()
	{
		// Arrange
		MfaSettings settings =
			CreateValidSettings();

		// Act
		TestValidationResult<MfaSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_CodeLengthBelowMinimum_FailsValidation()
	{
		// Arrange
		MfaSettings settings =
			CreateValidSettings() with { CodeLength = 3 };

		// Act
		TestValidationResult<MfaSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			mfa => mfa.CodeLength);
	}

	[Fact]
	public void Validate_CodeLengthAboveMaximum_FailsValidation()
	{
		// Arrange
		MfaSettings settings =
			CreateValidSettings() with { CodeLength = 11 };

		// Act
		TestValidationResult<MfaSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			mfa => mfa.CodeLength);
	}

	[Fact]
	public void Validate_ZeroResendCooldownSeconds_FailsValidation()
	{
		// Arrange
		MfaSettings settings =
			CreateValidSettings() with { ResendCooldownSeconds = 0 };

		// Act
		TestValidationResult<MfaSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			mfa => mfa.ResendCooldownSeconds);
	}

	private static MfaSettings CreateValidSettings() =>
		new()
		{
			Enabled = true,
			CodeLength = 6,
			CodeExpirationMinutes = 10,
			MaxAttempts = 5,
			ResendCooldownSeconds = 60,
		};
}