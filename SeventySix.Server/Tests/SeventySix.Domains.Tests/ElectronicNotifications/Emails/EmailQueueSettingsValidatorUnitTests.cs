// <copyright file="EmailQueueSettingsValidatorUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.ElectronicNotifications.Emails;

namespace SeventySix.Domains.Tests.ElectronicNotifications.Emails;

/// <summary>
/// Unit tests for EmailQueueSettingsValidator.
/// </summary>
public sealed class EmailQueueSettingsValidatorUnitTests
{
	private readonly EmailQueueSettingsValidator Validator = new();

	[Fact]
	public void Validate_ValidEnabledSettings_PassesValidation()
	{
		// Arrange
		EmailQueueSettings settings =
			CreateValidSettings();

		// Act
		TestValidationResult<EmailQueueSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_DisabledWithZeroBatchSize_PassesValidation()
	{
		// Arrange
		EmailQueueSettings settings =
			CreateValidSettings() with { Enabled = false, BatchSize = 0 };

		// Act
		TestValidationResult<EmailQueueSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_EnabledWithZeroBatchSize_FailsValidation()
	{
		// Arrange
		EmailQueueSettings settings =
			CreateValidSettings() with { BatchSize = 0 };

		// Act
		TestValidationResult<EmailQueueSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			queue => queue.BatchSize);
	}

	[Fact]
	public void Validate_EnabledWithZeroMaxAttempts_FailsValidation()
	{
		// Arrange
		EmailQueueSettings settings =
			CreateValidSettings() with { MaxAttempts = 0 };

		// Act
		TestValidationResult<EmailQueueSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			queue => queue.MaxAttempts);
	}

	private static EmailQueueSettings CreateValidSettings() =>
		new()
		{
			Enabled = true,
			ProcessingIntervalSeconds = 30,
			BatchSize = 50,
			MaxAttempts = 3,
			RetryDelayMinutes = 5,
			DeadLetterAfterHours = 24,
		};
}
