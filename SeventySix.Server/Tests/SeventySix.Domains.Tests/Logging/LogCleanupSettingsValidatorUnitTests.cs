// <copyright file="LogCleanupSettingsValidatorUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Logging;

namespace SeventySix.Domains.Tests.Logging;

/// <summary>
/// Unit tests for LogCleanupSettingsValidator.
/// </summary>
public sealed class LogCleanupSettingsValidatorUnitTests
{
	private readonly LogCleanupSettingsValidator Validator = new();

	[Fact]
	public void Validate_ValidEnabledSettings_PassesValidation()
	{
		// Arrange
		LogCleanupSettings settings =
			CreateValidSettings();

		// Act
		TestValidationResult<LogCleanupSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_DisabledWithEmptyDirectory_PassesValidation()
	{
		// Arrange
		LogCleanupSettings settings =
			CreateValidSettings() with { Enabled = false, LogDirectory = string.Empty };

		// Act
		TestValidationResult<LogCleanupSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_EnabledWithEmptyLogDirectory_FailsValidation()
	{
		// Arrange
		LogCleanupSettings settings =
			CreateValidSettings() with { LogDirectory = string.Empty };

		// Act
		TestValidationResult<LogCleanupSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			cleanup => cleanup.LogDirectory);
	}

	[Fact]
	public void Validate_EnabledWithRetentionDaysAboveMaximum_FailsValidation()
	{
		// Arrange
		LogCleanupSettings settings =
			CreateValidSettings() with { RetentionDays = 366 };

		// Act
		TestValidationResult<LogCleanupSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			cleanup => cleanup.RetentionDays);
	}

	[Fact]
	public void Validate_EnabledWithMonthlyInterval_PassesValidation()
	{
		// Arrange
		LogCleanupSettings settings =
			CreateValidSettings() with { IntervalHours = 720 };

		// Act
		TestValidationResult<LogCleanupSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveValidationErrorFor(
			cleanup => cleanup.IntervalHours);
	}

	[Fact]
	public void Validate_EnabledWithInvalidPreferredHour_FailsValidation()
	{
		// Arrange
		LogCleanupSettings settings =
			CreateValidSettings() with { PreferredStartHourUtc = 24 };

		// Act
		TestValidationResult<LogCleanupSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			cleanup => cleanup.PreferredStartHourUtc);
	}

	[Fact]
	public void Validate_EnabledWithInvalidPreferredMinute_FailsValidation()
	{
		// Arrange
		LogCleanupSettings settings =
			CreateValidSettings() with { PreferredStartMinuteUtc = 60 };

		// Act
		TestValidationResult<LogCleanupSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			cleanup => cleanup.PreferredStartMinuteUtc);
	}

	private static LogCleanupSettings CreateValidSettings() =>
		new()
		{
			Enabled = true,
			IntervalHours = 24,
			RetentionDays = 30,
			InitialDelayMinutes = 5,
			LogDirectory = "logs",
			LogFilePattern = "*.log",
			PreferredStartHourUtc = 3,
			PreferredStartMinuteUtc = 0,
		};
}