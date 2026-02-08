// <copyright file="SecuritySettingsValidatorUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Api.Configuration;

namespace SeventySix.Api.Tests.Configuration;

/// <summary>
/// Unit tests for SecuritySettingsValidator.
/// </summary>
public sealed class SecuritySettingsValidatorUnitTests
{
	private readonly SecuritySettingsValidator Validator = new();

	[Fact]
	public void Validate_ValidSettings_PassesValidation()
	{
		// Arrange
		SecuritySettings settings =
			CreateValidSettings();

		// Act
		TestValidationResult<SecuritySettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_NegativeHstsMaxAge_FailsValidation()
	{
		// Arrange
		SecuritySettings settings =
			CreateValidSettings() with { HstsMaxAgeSeconds = -1 };

		// Act
		TestValidationResult<SecuritySettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			security => security.HstsMaxAgeSeconds);
	}

	[Fact]
	public void Validate_EnforceHttpsWithZeroPort_FailsValidation()
	{
		// Arrange
		SecuritySettings settings =
			CreateValidSettings() with { EnforceHttps = true, HttpsPort = 0 };

		// Act
		TestValidationResult<SecuritySettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			security => security.HttpsPort);
	}

	[Fact]
	public void Validate_HttpsDisabledWithZeroPort_PassesValidation()
	{
		// Arrange
		SecuritySettings settings =
			CreateValidSettings() with { EnforceHttps = false, HttpsPort = 0 };

		// Act
		TestValidationResult<SecuritySettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	private static SecuritySettings CreateValidSettings() =>
		new()
		{
			EnforceHttps = true,
			HttpsPort = 443,
			HstsMaxAgeSeconds = 31536000,
			HstsIncludeSubdomains = true,
		};
}
