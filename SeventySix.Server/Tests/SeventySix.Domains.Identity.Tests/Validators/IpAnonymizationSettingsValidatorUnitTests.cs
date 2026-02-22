// <copyright file="IpAnonymizationSettingsValidatorUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Identity.Settings;

namespace SeventySix.Domains.Identity.Tests.Validators;

/// <summary>
/// Unit tests for IpAnonymizationSettingsValidator.
/// </summary>
public sealed class IpAnonymizationSettingsValidatorUnitTests
{
	private readonly IpAnonymizationSettingsValidator Validator = new();

	[Fact]
	public void Validate_ValidSettings_PassesValidation()
	{
		// Arrange
		IpAnonymizationSettings settings =
			CreateValidSettings();

		// Act
		TestValidationResult<IpAnonymizationSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_IntervalDaysBelowMinimum_FailsValidation()
	{
		// Arrange
		IpAnonymizationSettings settings =
			CreateValidSettings() with { IntervalDays = 0 };

		// Act
		TestValidationResult<IpAnonymizationSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			anonymization => anonymization.IntervalDays);
	}

	[Fact]
	public void Validate_RetentionDaysAboveMaximum_FailsValidation()
	{
		// Arrange
		IpAnonymizationSettings settings =
			CreateValidSettings() with { RetentionDays = 366 };

		// Act
		TestValidationResult<IpAnonymizationSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			anonymization => anonymization.RetentionDays);
	}

	private static IpAnonymizationSettings CreateValidSettings() =>
		new()
		{
			IntervalDays = 7,
			RetentionDays = 90,
			PreferredStartHourUtc = 2,
			PreferredStartMinuteUtc = 30,
		};
}