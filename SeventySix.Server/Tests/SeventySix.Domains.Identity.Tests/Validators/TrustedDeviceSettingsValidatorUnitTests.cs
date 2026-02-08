// <copyright file="TrustedDeviceSettingsValidatorUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Identity;

namespace SeventySix.Domains.Identity.Tests.Validators;

/// <summary>
/// Unit tests for TrustedDeviceSettingsValidator.
/// </summary>
public sealed class TrustedDeviceSettingsValidatorUnitTests
{
	private readonly TrustedDeviceSettingsValidator Validator = new();

	[Fact]
	public void Validate_ValidSettings_PassesValidation()
	{
		// Arrange
		TrustedDeviceSettings settings =
			CreateValidSettings();

		// Act
		TestValidationResult<TrustedDeviceSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_TokenLifetimeAboveMaximum_FailsValidation()
	{
		// Arrange
		TrustedDeviceSettings settings =
			CreateValidSettings() with { TokenLifetimeDays = 91 };

		// Act
		TestValidationResult<TrustedDeviceSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			device => device.TokenLifetimeDays);
	}

	[Fact]
	public void Validate_EmptyCookieName_FailsValidation()
	{
		// Arrange
		TrustedDeviceSettings settings =
			CreateValidSettings() with { CookieName = string.Empty };

		// Act
		TestValidationResult<TrustedDeviceSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			device => device.CookieName);
	}

	private static TrustedDeviceSettings CreateValidSettings() =>
		new()
		{
			TokenLifetimeDays = 30,
			MaxDevicesPerUser = 5,
			CookieName = "trusted_device",
		};
}
