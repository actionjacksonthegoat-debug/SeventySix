// <copyright file="AdminSeederSettingsValidatorUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Identity.Settings;

namespace SeventySix.Domains.Identity.Tests.Validators;

/// <summary>
/// Unit tests for AdminSeederSettingsValidator.
/// </summary>
public sealed class AdminSeederSettingsValidatorUnitTests
{
	private readonly AdminSeederSettingsValidator Validator = new();

	[Fact]
	public void Validate_ValidEnabledSettings_PassesValidation()
	{
		// Arrange
		AdminSeederSettings settings =
			CreateValidSettings();

		// Act
		TestValidationResult<AdminSeederSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_DisabledWithEmptyFields_PassesValidation()
	{
		// Arrange
		AdminSeederSettings settings =
			CreateValidSettings() with { Enabled = false, Username = string.Empty };

		// Act
		TestValidationResult<AdminSeederSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_EnabledWithEmptyUsername_FailsValidation()
	{
		// Arrange
		AdminSeederSettings settings =
			CreateValidSettings() with { Username = string.Empty };

		// Act
		TestValidationResult<AdminSeederSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			seeder => seeder.Username);
	}

	[Fact]
	public void Validate_EnabledWithEmptyEmail_FailsValidation()
	{
		// Arrange
		AdminSeederSettings settings =
			CreateValidSettings() with { Email = string.Empty };

		// Act
		TestValidationResult<AdminSeederSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			seeder => seeder.Email);
	}

	[Fact]
	public void Validate_EnabledWithEmptyFullName_FailsValidation()
	{
		// Arrange
		AdminSeederSettings settings =
			CreateValidSettings() with { FullName = string.Empty };

		// Act
		TestValidationResult<AdminSeederSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			seeder => seeder.FullName);
	}

	private static AdminSeederSettings CreateValidSettings() =>
		new()
		{
			Enabled = true,
			Username = "admin",
			Email = "admin@test.local",
			FullName = "Admin User",
			InitialPassword = "TestPassword123!",
		};
}
