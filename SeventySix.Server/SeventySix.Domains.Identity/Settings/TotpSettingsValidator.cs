// <copyright file="TotpSettingsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity;

/// <summary>
/// Validates <see cref="TotpSettings"/> configuration values.
/// </summary>
public sealed class TotpSettingsValidator : AbstractValidator<TotpSettings>
{
	private static readonly int[] ValidTimeSteps =
		[30, 60];

	/// <summary>
	/// Initializes a new instance of the <see cref="TotpSettingsValidator"/> class.
	/// </summary>
	public TotpSettingsValidator()
	{
		RuleFor(totp => totp.IssuerName)
			.NotEmpty()
			.WithMessage("Totp:IssuerName is required");

		RuleFor(totp => totp.AllowedTimeStepDrift)
			.InclusiveBetween(0, 3)
			.WithMessage("Totp:AllowedTimeStepDrift must be between 0 and 3");

		RuleFor(totp => totp.TimeStepSeconds)
			.Must(timeStep => ValidTimeSteps.Contains(timeStep))
			.WithMessage("Totp:TimeStepSeconds must be 30 or 60 (RFC 6238)");
	}
}