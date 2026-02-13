// <copyright file="ThirdPartyApiLimitSettingsValidatorUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;

namespace SeventySix.Shared.Tests.Validators;

/// <summary>
/// Unit tests for ThirdPartyApiLimitSettingsValidator.
/// </summary>
public sealed class ThirdPartyApiLimitSettingsValidatorUnitTests
{
	private readonly ThirdPartyApiLimitSettingsValidator Validator = new();

	[Fact]
	public void Validate_ValidSettings_PassesValidation()
	{
		// Arrange
		ThirdPartyApiLimitSettings settings =
			CreateValidSettings();

		// Act
		TestValidationResult<ThirdPartyApiLimitSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_ZeroDefaultDailyLimit_FailsValidation()
	{
		// Arrange
		ThirdPartyApiLimitSettings settings =
			CreateValidSettings() with { DefaultDailyLimit = 0 };

		// Act
		TestValidationResult<ThirdPartyApiLimitSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			apiLimit => apiLimit.DefaultDailyLimit);
	}

	[Fact]
	public void Validate_ZeroDefaultMonthlyLimit_FailsValidation()
	{
		// Arrange
		ThirdPartyApiLimitSettings settings =
			CreateValidSettings() with { DefaultMonthlyLimit = 0 };

		// Act
		TestValidationResult<ThirdPartyApiLimitSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			apiLimit => apiLimit.DefaultMonthlyLimit);
	}

	private static ThirdPartyApiLimitSettings CreateValidSettings() =>
		new()
		{
			Enabled = true,
			DefaultDailyLimit = 100,
			DefaultMonthlyLimit = 3000,
		};
}