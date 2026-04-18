// <copyright file="EmailQueueRetentionSettingsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.ElectronicNotifications.Emails;

/// <summary>
/// Validates <see cref="EmailQueueRetentionSettings"/> configuration values.
/// </summary>
public sealed class EmailQueueRetentionSettingsValidator : AbstractValidator<EmailQueueRetentionSettings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="EmailQueueRetentionSettingsValidator"/> class.
	/// </summary>
	public EmailQueueRetentionSettingsValidator()
	{
		When(
			settings => settings.Enabled,
			() =>
			{
				RuleFor(settings => settings.IntervalHours)
					.InclusiveBetween(1, 744)
					.WithMessage("Email:Retention:IntervalHours must be between 1 and 744");

				RuleFor(settings => settings.RetentionDays)
					.InclusiveBetween(1, 365)
					.WithMessage("Email:Retention:RetentionDays must be between 1 and 365");

				RuleFor(settings => settings.PreferredStartHourUtc)
					.InclusiveBetween(0, 23)
					.WithMessage("Email:Retention:PreferredStartHourUtc must be between 0 and 23");

				RuleFor(settings => settings.PreferredStartMinuteUtc)
					.InclusiveBetween(0, 59)
					.WithMessage("Email:Retention:PreferredStartMinuteUtc must be between 0 and 59");
			});
	}
}
