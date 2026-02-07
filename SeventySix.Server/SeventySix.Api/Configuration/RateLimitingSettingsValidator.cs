// <copyright file="RateLimitingSettingsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Api.Configuration;

/// <summary>
/// FluentValidation validator for RateLimitingSettings.
/// Ensures rate limiting configuration is valid at startup.
/// </summary>
/// <remarks>
/// Validates:
/// - PermitLimit is greater than 0
/// - WindowSeconds is greater than 0
/// - RetryAfterSeconds is greater than 0
/// - Health settings are valid when present
///
/// This validator is used at application startup to fail fast
/// if rate limiting configuration is invalid or missing.
/// </remarks>
public sealed class RateLimitingSettingsValidator : AbstractValidator<RateLimitingSettings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="RateLimitingSettingsValidator"/> class.
	/// </summary>
	public RateLimitingSettingsValidator()
	{
		RuleFor(settings => settings.PermitLimit)
			.GreaterThan(0)
			.WithMessage("RateLimiting:PermitLimit must be greater than 0");

		RuleFor(settings => settings.WindowSeconds)
			.GreaterThan(0)
			.WithMessage("RateLimiting:WindowSeconds must be greater than 0");

		RuleFor(settings => settings.RetryAfterSeconds)
			.GreaterThan(0)
			.WithMessage("RateLimiting:RetryAfterSeconds must be greater than 0");

		RuleFor(settings => settings.Health)
			.NotNull()
			.WithMessage("RateLimiting:Health configuration is required");

		When(
			settings => settings.Health is not null,
			() =>
			{
				RuleFor(settings => settings.Health.PermitLimit)
					.GreaterThan(0)
					.WithMessage("RateLimiting:Health:PermitLimit must be greater than 0");

				RuleFor(settings => settings.Health.WindowSeconds)
					.GreaterThan(0)
					.WithMessage("RateLimiting:Health:WindowSeconds must be greater than 0");
			});
	}
}