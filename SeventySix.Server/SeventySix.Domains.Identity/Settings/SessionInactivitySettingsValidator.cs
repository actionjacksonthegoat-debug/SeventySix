// <copyright file="SessionInactivitySettingsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity;

/// <summary>
/// Validator for session inactivity settings.
/// </summary>
public sealed class SessionInactivitySettingsValidator : AbstractValidator<SessionInactivitySettings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="SessionInactivitySettingsValidator"/> class.
	/// </summary>
	public SessionInactivitySettingsValidator()
	{
		When(
			settings => settings.Enabled,
			() =>
			{
				RuleFor(settings => settings.TimeoutMinutes)
					.InclusiveBetween(5, 120)
					.WithMessage(
						"Inactivity timeout must be between 5 and 120 minutes.");

				RuleFor(settings => settings.WarningSeconds)
					.InclusiveBetween(30, 300)
					.WithMessage(
						"Warning period must be between 30 and 300 seconds.");
			});
	}
}