// <copyright file="BackupCodeSettingsValidatorUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Identity;

namespace SeventySix.Domains.Identity.Tests.Validators;

/// <summary>
/// Unit tests for BackupCodeSettingsValidator.
/// </summary>
public sealed class BackupCodeSettingsValidatorUnitTests
{
	private readonly BackupCodeSettingsValidator Validator = new();

	[Fact]
	public void Validate_ValidSettings_PassesValidation()
	{
		// Arrange
		BackupCodeSettings settings =
			CreateValidSettings();

		// Act
		TestValidationResult<BackupCodeSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_CodeCountBelowMinimum_FailsValidation()
	{
		// Arrange
		BackupCodeSettings settings =
			CreateValidSettings() with { CodeCount = 4 };

		// Act
		TestValidationResult<BackupCodeSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			backup => backup.CodeCount);
	}

	[Fact]
	public void Validate_CodeLengthBelowMinimum_FailsValidation()
	{
		// Arrange
		BackupCodeSettings settings =
			CreateValidSettings() with { CodeLength = 5 };

		// Act
		TestValidationResult<BackupCodeSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			backup => backup.CodeLength);
	}

	private static BackupCodeSettings CreateValidSettings() =>
		new()
		{
			CodeCount = 10,
			CodeLength = 8,
		};
}