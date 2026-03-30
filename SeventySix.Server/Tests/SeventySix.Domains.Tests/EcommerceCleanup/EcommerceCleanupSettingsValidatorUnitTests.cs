// <copyright file="EcommerceCleanupSettingsValidatorUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.EcommerceCleanup.Settings;

namespace SeventySix.Domains.Tests.EcommerceCleanup;

/// <summary>
/// Unit tests for <see cref="EcommerceCleanupSettingsValidator"/>.
/// </summary>
public sealed class EcommerceCleanupSettingsValidatorUnitTests
{
	private readonly EcommerceCleanupSettingsValidator Validator = new();

	[Fact]
	public void Validate_ValidEnabledSettings_PassesValidation()
	{
		// Arrange
		EcommerceCleanupSettings settings =
			CreateValidSettings();

		// Act
		TestValidationResult<EcommerceCleanupSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_DisabledWithEmptyConnectionStrings_PassesValidation()
	{
		// Arrange
		EcommerceCleanupSettings settings =
			CreateValidSettings() with
			{
				Enabled = false,
				SvelteKitConnectionString = string.Empty,
				TanStackConnectionString = string.Empty
			};

		// Act
		TestValidationResult<EcommerceCleanupSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_EnabledWithEmptySvelteKitConnectionString_FailsValidation()
	{
		// Arrange
		EcommerceCleanupSettings settings =
			CreateValidSettings() with { SvelteKitConnectionString = string.Empty };

		// Act
		TestValidationResult<EcommerceCleanupSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			cleanup => cleanup.SvelteKitConnectionString);
	}

	[Fact]
	public void Validate_EnabledWithEmptyTanStackConnectionString_FailsValidation()
	{
		// Arrange
		EcommerceCleanupSettings settings =
			CreateValidSettings() with { TanStackConnectionString = string.Empty };

		// Act
		TestValidationResult<EcommerceCleanupSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			cleanup => cleanup.TanStackConnectionString);
	}

	[Theory]
	[InlineData(0)]
	[InlineData(366)]
	public void Validate_EnabledWithInvalidRetentionDays_FailsValidation(
		int retentionDays)
	{
		// Arrange
		EcommerceCleanupSettings settings =
			CreateValidSettings() with
			{
				CartSessions = CreateValidSettings().CartSessions with
				{
					RetentionDays = retentionDays
				}
			};

		// Act
		TestValidationResult<EcommerceCleanupSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			cleanup => cleanup.CartSessions.RetentionDays);
	}

	[Theory]
	[InlineData(0)]
	[InlineData(745)]
	public void Validate_EnabledWithInvalidIntervalHours_FailsValidation(
		int intervalHours)
	{
		// Arrange
		EcommerceCleanupSettings settings =
			CreateValidSettings() with
			{
				CartSessions = CreateValidSettings().CartSessions with
				{
					IntervalHours = intervalHours
				}
			};

		// Act
		TestValidationResult<EcommerceCleanupSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			cleanup => cleanup.CartSessions.IntervalHours);
	}

	[Fact]
	public void Validate_EnabledWithInvalidPreferredHour_FailsValidation()
	{
		// Arrange
		EcommerceCleanupSettings settings =
			CreateValidSettings() with
			{
				CartSessions = CreateValidSettings().CartSessions with
				{
					PreferredStartHourUtc = 24
				}
			};

		// Act
		TestValidationResult<EcommerceCleanupSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			cleanup => cleanup.CartSessions.PreferredStartHourUtc);
	}

	[Fact]
	public void Validate_EnabledWithInvalidPreferredMinute_FailsValidation()
	{
		// Arrange
		EcommerceCleanupSettings settings =
			CreateValidSettings() with
			{
				CartSessions = CreateValidSettings().CartSessions with
				{
					PreferredStartMinuteUtc = 60
				}
			};

		// Act
		TestValidationResult<EcommerceCleanupSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(
			cleanup => cleanup.CartSessions.PreferredStartMinuteUtc);
	}

	private static EcommerceCleanupSettings CreateValidSettings() =>
		new()
		{
			Enabled = true,
			SvelteKitConnectionString = "Host=localhost;Database=test_sveltekit",
			TanStackConnectionString = "Host=localhost;Database=test_tanstack",
			CartSessions = new CartSessionCleanupSettings
			{
				RetentionDays = 30,
				IntervalHours = 24,
				PreferredStartHourUtc = 3,
				PreferredStartMinuteUtc = 0,
			},
		};
}