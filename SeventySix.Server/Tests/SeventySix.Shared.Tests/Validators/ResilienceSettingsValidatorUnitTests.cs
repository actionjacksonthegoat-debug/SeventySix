// <copyright file="ResilienceSettingsValidatorUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Shared.Settings;

namespace SeventySix.Shared.Tests.Validators;

/// <summary>
/// Unit tests for ResilienceSettingsValidator.
/// Validates HTTP resilience configuration requirements.
/// </summary>
/// <remarks>
/// Test Pattern: MethodName_Scenario_ExpectedResult
/// </remarks>
public sealed class ResilienceOptionsValidatorUnitTests
{
	private readonly ResilienceSettingsValidator Validator = new();

	/// <summary>
	/// Creates a valid ResilienceSettings instance with optional overrides.
	/// </summary>
	/// <param name="retryCount">
	/// The retry count.
	/// </param>
	/// <param name="retryDelaySeconds">
	/// The retry delay in seconds.
	/// </param>
	/// <param name="circuitBreakerFailureThreshold">
	/// The circuit breaker failure threshold.
	/// </param>
	/// <param name="circuitBreakerSamplingDurationSeconds">
	/// The circuit breaker sampling duration in seconds.
	/// </param>
	/// <param name="circuitBreakerBreakDurationSeconds">
	/// The circuit breaker break duration in seconds.
	/// </param>
	/// <param name="timeoutSeconds">
	/// The timeout in seconds.
	/// </param>
	/// <param name="timeoutMilliseconds">
	/// The timeout in milliseconds.
	/// </param>
	/// <returns>
	/// A configured ResilienceSettings instance.
	/// </returns>
	private static ResilienceSettings CreateValidOptions(
		int retryCount = 3,
		int retryDelaySeconds = 2,
		int circuitBreakerFailureThreshold = 5,
		int circuitBreakerSamplingDurationSeconds = 60,
		int circuitBreakerBreakDurationSeconds = 30,
		int timeoutSeconds = 10,
		int timeoutMilliseconds = 0) =>
		new()
		{
			RetryCount = retryCount,
			RetryDelaySeconds = retryDelaySeconds,
			CircuitBreakerFailureThreshold = circuitBreakerFailureThreshold,
			CircuitBreakerSamplingDurationSeconds = circuitBreakerSamplingDurationSeconds,
			CircuitBreakerBreakDurationSeconds = circuitBreakerBreakDurationSeconds,
			TimeoutSeconds = timeoutSeconds,
			TimeoutMilliseconds = timeoutMilliseconds,
			UseJitter = true,
		};

	[Fact]
	public void Validate_ValidSettings_PassesValidation()
	{
		// Arrange
		ResilienceSettings options =
			CreateValidOptions();

		// Act
		TestValidationResult<ResilienceSettings> result =
			Validator.TestValidate(options);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_NegativeRetryCount_FailsValidation()
	{
		// Arrange
		ResilienceSettings options =
			CreateValidOptions(retryCount: -1);

		// Act
		TestValidationResult<ResilienceSettings> result =
			Validator.TestValidate(options);

		// Assert
		result
			.ShouldHaveValidationErrorFor(options => options.RetryCount)
			.WithErrorMessage("Resilience:RetryCount must be >= 0");
	}

	[Fact]
	public void Validate_ZeroRetryCount_PassesValidation()
	{
		// Arrange
		ResilienceSettings options =
			CreateValidOptions(retryCount: 0);

		// Act
		TestValidationResult<ResilienceSettings> result =
			Validator.TestValidate(options);

		// Assert
		result.ShouldNotHaveValidationErrorFor(options => options.RetryCount);
	}

	[Fact]
	public void Validate_ZeroRetryDelaySeconds_FailsValidation()
	{
		// Arrange
		ResilienceSettings options =
			CreateValidOptions(retryDelaySeconds: 0);

		// Act
		TestValidationResult<ResilienceSettings> result =
			Validator.TestValidate(options);

		// Assert
		result
			.ShouldHaveValidationErrorFor(options => options.RetryDelaySeconds)
			.WithErrorMessage("Resilience:RetryDelaySeconds must be > 0");
	}

	[Fact]
	public void Validate_ZeroCircuitBreakerFailureThreshold_FailsValidation()
	{
		// Arrange
		ResilienceSettings options =
			CreateValidOptions(circuitBreakerFailureThreshold: 0);

		// Act
		TestValidationResult<ResilienceSettings> result =
			Validator.TestValidate(options);

		// Assert
		result
			.ShouldHaveValidationErrorFor(options => options.CircuitBreakerFailureThreshold)
			.WithErrorMessage("Resilience:CircuitBreakerFailureThreshold must be > 0");
	}

	[Fact]
	public void Validate_ZeroCircuitBreakerSamplingDurationSeconds_FailsValidation()
	{
		// Arrange
		ResilienceSettings options =
			CreateValidOptions(circuitBreakerSamplingDurationSeconds: 0);

		// Act
		TestValidationResult<ResilienceSettings> result =
			Validator.TestValidate(options);

		// Assert
		result
			.ShouldHaveValidationErrorFor(options => options.CircuitBreakerSamplingDurationSeconds)
			.WithErrorMessage("Resilience:CircuitBreakerSamplingDurationSeconds must be > 0");
	}

	[Fact]
	public void Validate_ZeroCircuitBreakerBreakDurationSeconds_FailsValidation()
	{
		// Arrange
		ResilienceSettings options =
			CreateValidOptions(circuitBreakerBreakDurationSeconds: 0);

		// Act
		TestValidationResult<ResilienceSettings> result =
			Validator.TestValidate(options);

		// Assert
		result
			.ShouldHaveValidationErrorFor(options => options.CircuitBreakerBreakDurationSeconds)
			.WithErrorMessage("Resilience:CircuitBreakerBreakDurationSeconds must be > 0");
	}

	[Fact]
	public void Validate_BothTimeoutsZero_FailsValidation()
	{
		// Arrange
		ResilienceSettings options =
			CreateValidOptions(
				timeoutSeconds: 0,
				timeoutMilliseconds: 0);

		// Act
		TestValidationResult<ResilienceSettings> result =
			Validator.TestValidate(options);

		// Assert
		result
			.ShouldHaveValidationErrorFor(options => options)
			.WithErrorMessage("Resilience: Either TimeoutSeconds or TimeoutMilliseconds must be > 0");
	}

	[Fact]
	public void Validate_OnlyTimeoutMillisecondsSet_PassesValidation()
	{
		// Arrange
		ResilienceSettings options =
			CreateValidOptions(
				timeoutSeconds: 0,
				timeoutMilliseconds: 100);

		// Act
		TestValidationResult<ResilienceSettings> result =
			Validator.TestValidate(options);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_OnlyTimeoutSecondsSet_PassesValidation()
	{
		// Arrange
		ResilienceSettings options =
			CreateValidOptions(
				timeoutSeconds: 10,
				timeoutMilliseconds: 0);

		// Act
		TestValidationResult<ResilienceSettings> result =
			Validator.TestValidate(options);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}
}