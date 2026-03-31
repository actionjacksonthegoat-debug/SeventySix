// <copyright file="EcommerceCleanupSettingsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.EcommerceCleanup.Settings;

/// <summary>
/// Validates <see cref="EcommerceCleanupSettings"/> configuration values.
/// Only validates sub-settings when cleanup is enabled.
/// </summary>
public sealed class EcommerceCleanupSettingsValidator : AbstractValidator<EcommerceCleanupSettings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="EcommerceCleanupSettingsValidator"/> class.
	/// </summary>
	public EcommerceCleanupSettingsValidator()
	{
		When(
			cleanup => cleanup.Enabled,
			() =>
			{
				RuleFor(cleanup => cleanup.SvelteKitConnectionString)
					.NotEmpty()
					.WithMessage("EcommerceCleanup:SvelteKitConnectionString must be configured when enabled");

				RuleFor(cleanup => cleanup.TanStackConnectionString)
					.NotEmpty()
					.WithMessage("EcommerceCleanup:TanStackConnectionString must be configured when enabled");

				RuleFor(cleanup => cleanup.CartSessions.RetentionDays)
					.InclusiveBetween(1, 365)
					.WithMessage("EcommerceCleanup:CartSessions:RetentionDays must be between 1 and 365");

				RuleFor(cleanup => cleanup.CartSessions.IntervalHours)
					.InclusiveBetween(1, 744)
					.WithMessage("EcommerceCleanup:CartSessions:IntervalHours must be between 1 and 744");

				RuleFor(cleanup => cleanup.CartSessions.PreferredStartHourUtc)
					.InclusiveBetween(0, 23)
					.WithMessage("EcommerceCleanup:CartSessions:PreferredStartHourUtc must be between 0 and 23");

				RuleFor(cleanup => cleanup.CartSessions.PreferredStartMinuteUtc)
					.InclusiveBetween(0, 59)
					.WithMessage("EcommerceCleanup:CartSessions:PreferredStartMinuteUtc must be between 0 and 59");
			});
	}
}