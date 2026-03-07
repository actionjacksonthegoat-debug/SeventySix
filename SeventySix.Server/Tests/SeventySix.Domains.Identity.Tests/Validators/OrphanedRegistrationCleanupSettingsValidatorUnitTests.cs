// <copyright file="OrphanedRegistrationCleanupSettingsValidatorUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Identity.Settings;

namespace SeventySix.Domains.Identity.Tests.Validators;

/// <summary>
/// Unit tests for <see cref="OrphanedRegistrationCleanupSettingsValidator"/>.
/// </summary>
public sealed class OrphanedRegistrationCleanupSettingsValidatorUnitTests
{
	private readonly OrphanedRegistrationCleanupSettingsValidator Validator = new();

	[Fact]
	public void Validate_ValidSettings_PassesValidation()
	{
		// Arrange
		OrphanedRegistrationCleanupSettings settings =
			CreateValidSettings();

		// Act
		TestValidationResult<OrphanedRegistrationCleanupSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_InvalidPreferredHour_FailsValidation()
	{
		// Arrange
		OrphanedRegistrationCleanupSettings settings =
			CreateValidSettings() with { PreferredStartHourUtc = 24 };

		// Act
		TestValidationResult<OrphanedRegistrationCleanupSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			cleanup => cleanup.PreferredStartHourUtc);
	}

	[Fact]
	public void Validate_InvalidPreferredMinute_FailsValidation()
	{
		// Arrange
		OrphanedRegistrationCleanupSettings settings =
			CreateValidSettings() with { PreferredStartMinuteUtc = 60 };

		// Act
		TestValidationResult<OrphanedRegistrationCleanupSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			cleanup => cleanup.PreferredStartMinuteUtc);
	}

	[Fact]
	public void Validate_DisabledWithInvalidPreferredTime_PassesValidation()
	{
		// Arrange
		OrphanedRegistrationCleanupSettings settings =
			CreateValidSettings() with
			{
				Enabled = false,
				PreferredStartHourUtc = 30,
				PreferredStartMinuteUtc = 80,
			};

		// Act
		TestValidationResult<OrphanedRegistrationCleanupSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	private static OrphanedRegistrationCleanupSettings CreateValidSettings() =>
		new()
		{
			Enabled = true,
			RetentionHours = 48,
			IntervalHours = 24,
			PreferredStartHourUtc = 9,
			PreferredStartMinuteUtc = 0,
		};
}