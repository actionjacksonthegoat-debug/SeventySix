// <copyright file="RateLimitingSettingsValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Api.Configuration;

namespace SeventySix.Api.Tests.Configuration;

/// <summary>
/// Unit tests for RateLimitingSettingsValidator.
/// Validates rate limiting configuration requirements.
/// </summary>
/// <remarks>
/// Test Pattern: MethodName_Scenario_ExpectedResult
/// </remarks>
public sealed class RateLimitingSettingsValidatorTests
{
	private readonly RateLimitingSettingsValidator Validator = new();

	/// <summary>
	/// Creates a valid RateLimitingSettings instance with optional overrides.
	/// </summary>
	/// <param name="permitLimit">
	/// The permit limit.
	/// </param>
	/// <param name="windowSeconds">
	/// The window in seconds.
	/// </param>
	/// <param name="retryAfterSeconds">
	/// The retry-after value in seconds.
	/// </param>
	/// <param name="healthPermitLimit">
	/// The health endpoint permit limit.
	/// </param>
	/// <param name="healthWindowSeconds">
	/// The health endpoint window in seconds.
	/// </param>
	/// <returns>
	/// A configured RateLimitingSettings instance.
	/// </returns>
	private static RateLimitingSettings CreateValidSettings(
		int permitLimit = 500,
		int windowSeconds = 3600,
		int retryAfterSeconds = 30,
		int healthPermitLimit = 30,
		int healthWindowSeconds = 60) =>
		new()
		{
			PermitLimit = permitLimit,
			WindowSeconds = windowSeconds,
			RetryAfterSeconds = retryAfterSeconds,
			Enabled = true,
			Health =
				new HealthRateLimitSettings
				{
					PermitLimit = healthPermitLimit,
					WindowSeconds = healthWindowSeconds,
				},
		};

	[Fact]
	public void Validate_ValidSettings_PassesValidation()
	{
		// Arrange
		RateLimitingSettings settings =
			CreateValidSettings();

		// Act
		TestValidationResult<RateLimitingSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_ZeroPermitLimit_FailsValidation()
	{
		// Arrange
		RateLimitingSettings settings =
			CreateValidSettings(permitLimit: 0);

		// Act
		TestValidationResult<RateLimitingSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result
			.ShouldHaveValidationErrorFor(settings => settings.PermitLimit)
			.WithErrorMessage("RateLimiting:PermitLimit must be greater than 0");
	}

	[Fact]
	public void Validate_NegativePermitLimit_FailsValidation()
	{
		// Arrange
		RateLimitingSettings settings =
			CreateValidSettings(permitLimit: -1);

		// Act
		TestValidationResult<RateLimitingSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result
			.ShouldHaveValidationErrorFor(settings => settings.PermitLimit)
			.WithErrorMessage("RateLimiting:PermitLimit must be greater than 0");
	}

	[Fact]
	public void Validate_ZeroWindowSeconds_FailsValidation()
	{
		// Arrange
		RateLimitingSettings settings =
			CreateValidSettings(windowSeconds: 0);

		// Act
		TestValidationResult<RateLimitingSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result
			.ShouldHaveValidationErrorFor(settings => settings.WindowSeconds)
			.WithErrorMessage("RateLimiting:WindowSeconds must be greater than 0");
	}

	[Fact]
	public void Validate_ZeroRetryAfterSeconds_FailsValidation()
	{
		// Arrange
		RateLimitingSettings settings =
			CreateValidSettings(retryAfterSeconds: 0);

		// Act
		TestValidationResult<RateLimitingSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result
			.ShouldHaveValidationErrorFor(settings => settings.RetryAfterSeconds)
			.WithErrorMessage("RateLimiting:RetryAfterSeconds must be greater than 0");
	}

	[Fact]
	public void Validate_ZeroHealthPermitLimit_FailsValidation()
	{
		// Arrange
		RateLimitingSettings settings =
			CreateValidSettings(healthPermitLimit: 0);

		// Act
		TestValidationResult<RateLimitingSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result
			.ShouldHaveValidationErrorFor(settings => settings.Health.PermitLimit)
			.WithErrorMessage("RateLimiting:Health:PermitLimit must be greater than 0");
	}

	[Fact]
	public void Validate_ZeroHealthWindowSeconds_FailsValidation()
	{
		// Arrange
		RateLimitingSettings settings =
			CreateValidSettings(healthWindowSeconds: 0);

		// Act
		TestValidationResult<RateLimitingSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result
			.ShouldHaveValidationErrorFor(settings => settings.Health.WindowSeconds)
			.WithErrorMessage("RateLimiting:Health:WindowSeconds must be greater than 0");
	}
}