// <copyright file="RefreshTokenCleanupSettingsValidatorUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Identity.Settings;

namespace SeventySix.Domains.Identity.Tests.Validators;

/// <summary>
/// Unit tests for RefreshTokenCleanupSettingsValidator.
/// </summary>
public sealed class RefreshTokenCleanupSettingsValidatorUnitTests
{
	private readonly RefreshTokenCleanupSettingsValidator Validator = new();

	[Fact]
	public void Validate_ValidSettings_PassesValidation()
	{
		// Arrange
		RefreshTokenCleanupSettings settings =
			CreateValidSettings();

		// Act
		TestValidationResult<RefreshTokenCleanupSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_IntervalHoursBelowMinimum_FailsValidation()
	{
		// Arrange
		RefreshTokenCleanupSettings settings =
			CreateValidSettings() with { IntervalHours = 0 };

		// Act
		TestValidationResult<RefreshTokenCleanupSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			cleanup => cleanup.IntervalHours);
	}

	[Fact]
	public void Validate_RetentionDaysAboveMaximum_FailsValidation()
	{
		// Arrange
		RefreshTokenCleanupSettings settings =
			CreateValidSettings() with { RetentionDays = 91 };

		// Act
		TestValidationResult<RefreshTokenCleanupSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			cleanup => cleanup.RetentionDays);
	}

	private static RefreshTokenCleanupSettings CreateValidSettings() =>
		new()
		{
			IntervalHours = 24,
			RetentionDays = 30,
			UsedTokenRetentionHours = 48,
			PreferredStartHourUtc = 3,
			PreferredStartMinuteUtc = 0,
		};
}