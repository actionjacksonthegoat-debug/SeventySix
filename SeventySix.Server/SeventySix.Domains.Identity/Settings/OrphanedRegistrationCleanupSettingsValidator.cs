// <copyright file="OrphanedRegistrationCleanupSettingsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity.Settings;

/// <summary>
/// Validates <see cref="OrphanedRegistrationCleanupSettings"/> configuration.
/// </summary>
public sealed class OrphanedRegistrationCleanupSettingsValidator
	: AbstractValidator<OrphanedRegistrationCleanupSettings>
{
	/// <summary>
	/// Initializes a new instance of the
	/// <see cref="OrphanedRegistrationCleanupSettingsValidator"/> class.
	/// </summary>
	public OrphanedRegistrationCleanupSettingsValidator()
	{
		RuleFor(settings => settings.RetentionHours)
			.GreaterThan(0)
			.WithMessage("OrphanedRegistrationCleanup:RetentionHours must be greater than 0");

		RuleFor(settings => settings.IntervalHours)
			.GreaterThan(0)
			.WithMessage("OrphanedRegistrationCleanup:IntervalHours must be greater than 0");
	}
}