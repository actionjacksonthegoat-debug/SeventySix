// <copyright file="ResilienceSettingsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Shared.Settings;

/// <summary>
/// FluentValidation validator for ResilienceSettings.
/// Ensures HTTP resilience configuration is valid at startup.
/// </summary>
/// <remarks>
/// Validates:
/// - RetryCount is greater than or equal to 0
/// - RetryDelaySeconds is greater than 0
/// - CircuitBreakerFailureThreshold is greater than 0
/// - CircuitBreakerSamplingDurationSeconds is greater than 0
/// - CircuitBreakerBreakDurationSeconds is greater than 0
/// - Either TimeoutSeconds or TimeoutMilliseconds is greater than 0
///
/// This validator is used at application startup to fail fast
/// if resilience configuration is invalid or missing.
/// </remarks>
public sealed class ResilienceSettingsValidator : AbstractValidator<ResilienceSettings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="ResilienceSettingsValidator"/> class.
	/// </summary>
	public ResilienceSettingsValidator()
	{
		RuleFor(options => options.RetryCount)
			.GreaterThanOrEqualTo(0)
			.WithMessage("Resilience:RetryCount must be >= 0");

		RuleFor(options => options.RetryDelaySeconds)
			.GreaterThan(0)
			.WithMessage("Resilience:RetryDelaySeconds must be > 0");

		RuleFor(options => options.CircuitBreakerFailureThreshold)
			.GreaterThan(0)
			.WithMessage("Resilience:CircuitBreakerFailureThreshold must be > 0");

		RuleFor(options => options.CircuitBreakerSamplingDurationSeconds)
			.GreaterThan(0)
			.WithMessage("Resilience:CircuitBreakerSamplingDurationSeconds must be > 0");

		RuleFor(options => options.CircuitBreakerBreakDurationSeconds)
			.GreaterThan(0)
			.WithMessage("Resilience:CircuitBreakerBreakDurationSeconds must be > 0");

		RuleFor(options => options.TimeoutSeconds)
			.GreaterThanOrEqualTo(0)
			.WithMessage("Resilience:TimeoutSeconds must be >= 0");

		RuleFor(options => options.TimeoutMilliseconds)
			.GreaterThanOrEqualTo(0)
			.WithMessage("Resilience:TimeoutMilliseconds must be >= 0");

		RuleFor(options => options)
			.Must(HasValidTimeout)
			.WithMessage("Resilience: Either TimeoutSeconds or TimeoutMilliseconds must be > 0");
	}

	/// <summary>
	/// Validates that at least one timeout value is configured.
	/// </summary>
	/// <param name="options">
	/// The resilience options to validate.
	/// </param>
	/// <returns>
	/// True if either TimeoutSeconds or TimeoutMilliseconds is greater than 0.
	/// </returns>
	private static bool HasValidTimeout(ResilienceSettings options)
	{
		return options.TimeoutSeconds > 0 || options.TimeoutMilliseconds > 0;
	}
}