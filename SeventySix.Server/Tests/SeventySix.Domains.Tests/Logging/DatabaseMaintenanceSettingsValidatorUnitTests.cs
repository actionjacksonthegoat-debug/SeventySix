// <copyright file="DatabaseMaintenanceSettingsValidatorUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Logging;

namespace SeventySix.Domains.Tests.Logging;

/// <summary>
/// Unit tests for DatabaseMaintenanceSettingsValidator.
/// </summary>
public sealed class DatabaseMaintenanceSettingsValidatorUnitTests
{
	private readonly DatabaseMaintenanceSettingsValidator Validator = new();

	[Fact]
	public void Validate_ValidEnabledSettings_PassesValidation()
	{
		// Arrange
		DatabaseMaintenanceSettings settings =
			CreateValidSettings();

		// Act
		TestValidationResult<DatabaseMaintenanceSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_DisabledWithZeroInterval_PassesValidation()
	{
		// Arrange
		DatabaseMaintenanceSettings settings =
			CreateValidSettings() with { Enabled = false, IntervalHours = 0 };

		// Act
		TestValidationResult<DatabaseMaintenanceSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_EnabledWithZeroIntervalHours_FailsValidation()
	{
		// Arrange
		DatabaseMaintenanceSettings settings =
			CreateValidSettings() with { IntervalHours = 0 };

		// Act
		TestValidationResult<DatabaseMaintenanceSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			maintenance => maintenance.IntervalHours);
	}

	[Fact]
	public void Validate_EnabledWithZeroInitialDelay_FailsValidation()
	{
		// Arrange
		DatabaseMaintenanceSettings settings =
			CreateValidSettings() with { InitialDelayMinutes = 0 };

		// Act
		TestValidationResult<DatabaseMaintenanceSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			maintenance => maintenance.InitialDelayMinutes);
	}

	[Fact]
	public void Validate_EnabledWithMonthlyInterval_PassesValidation()
	{
		// Arrange
		DatabaseMaintenanceSettings settings =
			CreateValidSettings() with { IntervalHours = 720 };

		// Act
		TestValidationResult<DatabaseMaintenanceSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveValidationErrorFor(
			maintenance => maintenance.IntervalHours);
	}

	[Fact]
	public void Validate_EnabledWithInvalidPreferredHour_FailsValidation()
	{
		// Arrange
		DatabaseMaintenanceSettings settings =
			CreateValidSettings() with { PreferredStartHourUtc = -1 };

		// Act
		TestValidationResult<DatabaseMaintenanceSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			maintenance => maintenance.PreferredStartHourUtc);
	}

	[Fact]
	public void Validate_EnabledWithInvalidPreferredMinute_FailsValidation()
	{
		// Arrange
		DatabaseMaintenanceSettings settings =
			CreateValidSettings() with { PreferredStartMinuteUtc = 61 };

		// Act
		TestValidationResult<DatabaseMaintenanceSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			maintenance => maintenance.PreferredStartMinuteUtc);
	}

	private static DatabaseMaintenanceSettings CreateValidSettings() =>
		new()
		{
			Enabled = true,
			IntervalHours = 24,
			InitialDelayMinutes = 5,
			PreferredStartHourUtc = 2,
			PreferredStartMinuteUtc = 0,
		};
}