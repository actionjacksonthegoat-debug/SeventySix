// <copyright file="TotpSettingsValidatorUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Identity;

namespace SeventySix.Domains.Identity.Tests.Validators;

/// <summary>
/// Unit tests for TotpSettingsValidator.
/// </summary>
public sealed class TotpSettingsValidatorUnitTests
{
	private readonly TotpSettingsValidator Validator = new();

	[Fact]
	public void Validate_ValidSettings_PassesValidation()
	{
		// Arrange
		TotpSettings settings =
			CreateValidSettings();

		// Act
		TestValidationResult<TotpSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_EmptyIssuerName_FailsValidation()
	{
		// Arrange
		TotpSettings settings =
			CreateValidSettings() with { IssuerName = string.Empty };

		// Act
		TestValidationResult<TotpSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			totp => totp.IssuerName);
	}

	[Fact]
	public void Validate_TimeStepDriftAboveMaximum_FailsValidation()
	{
		// Arrange
		TotpSettings settings =
			CreateValidSettings() with { AllowedTimeStepDrift = 4 };

		// Act
		TestValidationResult<TotpSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			totp => totp.AllowedTimeStepDrift);
	}

	[Fact]
	public void Validate_InvalidTimeStepSeconds_FailsValidation()
	{
		// Arrange
		TotpSettings settings =
			CreateValidSettings() with { TimeStepSeconds = 45 };

		// Act
		TestValidationResult<TotpSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			totp => totp.TimeStepSeconds);
	}

	private static TotpSettings CreateValidSettings() =>
		new()
		{
			IssuerName = "SeventySix",
			AllowedTimeStepDrift = 1,
			TimeStepSeconds = 30,
		};
}