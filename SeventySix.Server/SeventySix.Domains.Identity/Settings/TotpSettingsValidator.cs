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
	/// <summary>
	/// Minimum time step in seconds.
	/// Values below 30 are for E2E/test environments only (reduces TOTP wait times).
	/// </summary>
	private const int MinTimeStepSeconds = 10;

	/// <summary>
	/// Maximum time step in seconds (RFC 6238 allows 30 or 60).
	/// </summary>
	private const int MaxTimeStepSeconds = 60;

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
			.InclusiveBetween(MinTimeStepSeconds, MaxTimeStepSeconds)
			.WithMessage($"Totp:TimeStepSeconds must be between {MinTimeStepSeconds} and {MaxTimeStepSeconds}");
	}
}