// <copyright file="RefreshTokenCleanupSettingsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity.Settings;

/// <summary>
/// Validates <see cref="RefreshTokenCleanupSettings"/> configuration values.
/// </summary>
public sealed class RefreshTokenCleanupSettingsValidator : AbstractValidator<RefreshTokenCleanupSettings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="RefreshTokenCleanupSettingsValidator"/> class.
	/// </summary>
	public RefreshTokenCleanupSettingsValidator()
	{
		When(
			cleanup => cleanup.Enabled,
			() =>
			{
				RuleFor(cleanup => cleanup.IntervalHours)
					.InclusiveBetween(1, 744)
					.WithMessage("RefreshTokenCleanup:IntervalHours must be between 1 and 744");

				RuleFor(cleanup => cleanup.RetentionDays)
					.InclusiveBetween(1, 90)
					.WithMessage("RefreshTokenCleanup:RetentionDays must be between 1 and 90");

				RuleFor(cleanup => cleanup.PreferredStartHourUtc)
					.InclusiveBetween(0, 23)
					.WithMessage("RefreshTokenCleanup:PreferredStartHourUtc must be between 0 and 23");

				RuleFor(cleanup => cleanup.PreferredStartMinuteUtc)
					.InclusiveBetween(0, 59)
					.WithMessage("RefreshTokenCleanup:PreferredStartMinuteUtc must be between 0 and 59");
			});
	}
}