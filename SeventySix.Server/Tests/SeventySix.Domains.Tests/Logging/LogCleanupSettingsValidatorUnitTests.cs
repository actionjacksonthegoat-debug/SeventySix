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
