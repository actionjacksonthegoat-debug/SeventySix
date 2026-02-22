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
		RuleFor(cleanup => cleanup.IntervalHours)
			.InclusiveBetween(1, 168)
			.WithMessage("RefreshTokenCleanup:IntervalHours must be between 1 and 168");

		RuleFor(cleanup => cleanup.RetentionDays)
			.InclusiveBetween(1, 90)
			.WithMessage("RefreshTokenCleanup:RetentionDays must be between 1 and 90");
	}
}