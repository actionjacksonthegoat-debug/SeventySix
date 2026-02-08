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
					.InclusiveBetween(1, 168)
					.WithMessage("Logging:Cleanup:IntervalHours must be between 1 and 168");

				RuleFor(cleanup => cleanup.RetentionDays)
					.InclusiveBetween(1, 365)
					.WithMessage("Logging:Cleanup:RetentionDays must be between 1 and 365");

				RuleFor(cleanup => cleanup.LogDirectory)
					.NotEmpty()
					.WithMessage("Logging:Cleanup:LogDirectory is required when cleanup is enabled");

				RuleFor(cleanup => cleanup.LogFilePattern)
					.NotEmpty()
					.WithMessage("Logging:Cleanup:LogFilePattern is required when cleanup is enabled");
			});
	}
}
