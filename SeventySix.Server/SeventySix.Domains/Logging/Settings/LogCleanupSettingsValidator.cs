// <copyright file="LogCleanupSettingsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Logging;

/// <summary>
/// Validates <see cref="LogCleanupSettings"/> configuration values.
/// </summary>
public sealed class LogCleanupSettingsValidator : AbstractValidator<LogCleanupSettings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="LogCleanupSettingsValidator"/> class.
	/// </summary>
	public LogCleanupSettingsValidator()
	{
		When(
			cleanup => cleanup.Enabled,
			() =>
			{
				RuleFor(cleanup => cleanup.IntervalHours)
					.InclusiveBetween(1, 744)
					.WithMessage("Logging:Cleanup:IntervalHours must be between 1 and 744");

				RuleFor(cleanup => cleanup.RetentionDays)
					.InclusiveBetween(1, 365)
					.WithMessage("Logging:Cleanup:RetentionDays must be between 1 and 365");

				RuleFor(cleanup => cleanup.LogDirectory)
					.NotEmpty()
					.WithMessage("Logging:Cleanup:LogDirectory is required when cleanup is enabled");

				RuleFor(cleanup => cleanup.LogFilePattern)
					.NotEmpty()
					.WithMessage("Logging:Cleanup:LogFilePattern is required when cleanup is enabled");

				RuleFor(cleanup => cleanup.PreferredStartHourUtc)
					.InclusiveBetween(0, 23)
					.WithMessage("Logging:Cleanup:PreferredStartHourUtc must be between 0 and 23");

				RuleFor(cleanup => cleanup.PreferredStartMinuteUtc)
					.InclusiveBetween(0, 59)
					.WithMessage("Logging:Cleanup:PreferredStartMinuteUtc must be between 0 and 59");
			});
	}
}