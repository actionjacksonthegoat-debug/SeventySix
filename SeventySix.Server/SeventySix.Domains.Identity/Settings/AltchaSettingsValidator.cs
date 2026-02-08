// <copyright file="AltchaSettingsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity;

/// <summary>
/// Validates <see cref="AltchaSettings"/> configuration values.
/// </summary>
public sealed class AltchaSettingsValidator : AbstractValidator<AltchaSettings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="AltchaSettingsValidator"/> class.
	/// </summary>
	public AltchaSettingsValidator()
	{
		When(
			altcha => altcha.Enabled,
			() =>
			{
				RuleFor(altcha => altcha.HmacKeyBase64)
					.NotEmpty()
					.WithMessage("Altcha:HmacKeyBase64 is required when Altcha is enabled");

				RuleFor(altcha => altcha.ComplexityMin)
					.GreaterThan(0)
					.WithMessage("Altcha:ComplexityMin must be greater than 0");

				RuleFor(altcha => altcha.ComplexityMax)
					.GreaterThanOrEqualTo(altcha => altcha.ComplexityMin)
					.WithMessage("Altcha:ComplexityMax must be >= ComplexityMin");

				RuleFor(altcha => altcha.ExpirySeconds)
					.GreaterThan(0)
					.WithMessage("Altcha:ExpirySeconds must be greater than 0");
			});
	}
}