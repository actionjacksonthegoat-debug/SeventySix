// <copyright file="MfaSettingsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity;

/// <summary>
/// Validates <see cref="MfaSettings"/> configuration values.
/// </summary>
public sealed class MfaSettingsValidator : AbstractValidator<MfaSettings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="MfaSettingsValidator"/> class.
	/// </summary>
	public MfaSettingsValidator()
	{
		When(
			mfa => mfa.Enabled,
			() =>
			{
				RuleFor(mfa => mfa.CodeLength)
					.InclusiveBetween(4, 10)
					.WithMessage("Mfa:CodeLength must be between 4 and 10");

				RuleFor(mfa => mfa.CodeExpirationMinutes)
					.InclusiveBetween(1, 60)
					.WithMessage("Mfa:CodeExpirationMinutes must be between 1 and 60");

				RuleFor(mfa => mfa.MaxAttempts)
					.InclusiveBetween(1, 10)
					.WithMessage("Mfa:MaxAttempts must be between 1 and 10");

				RuleFor(mfa => mfa.ResendCooldownSeconds)
					.GreaterThan(0)
					.WithMessage("Mfa:ResendCooldownSeconds must be greater than 0");
			});
	}
}