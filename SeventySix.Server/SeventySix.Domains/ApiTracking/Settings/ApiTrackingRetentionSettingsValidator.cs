// <copyright file="ApiTrackingRetentionSettingsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.ApiTracking;

/// <summary>
/// Validates <see cref="ApiTrackingRetentionSettings"/> configuration values.
/// </summary>
public sealed class ApiTrackingRetentionSettingsValidator : AbstractValidator<ApiTrackingRetentionSettings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="ApiTrackingRetentionSettingsValidator"/> class.
	/// </summary>
	public ApiTrackingRetentionSettingsValidator()
	{
		When(
			settings => settings.Enabled,
			() =>
			{
				RuleFor(settings => settings.IntervalHours)
					.InclusiveBetween(1, 744)
					.WithMessage("ApiTracking:Retention:IntervalHours must be between 1 and 744");

				RuleFor(settings => settings.RetentionDays)
					.InclusiveBetween(1, 3650)
					.WithMessage("ApiTracking:Retention:RetentionDays must be between 1 and 3650");

				RuleFor(settings => settings.PreferredStartHourUtc)
					.InclusiveBetween(0, 23)
					.WithMessage("ApiTracking:Retention:PreferredStartHourUtc must be between 0 and 23");

				RuleFor(settings => settings.PreferredStartMinuteUtc)
					.InclusiveBetween(0, 59)
					.WithMessage("ApiTracking:Retention:PreferredStartMinuteUtc must be between 0 and 59");
			});
	}
}