// <copyright file="SecuritySettingsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Api.Configuration;

/// <summary>
/// Validates <see cref="SecuritySettings"/> configuration values.
/// </summary>
public sealed class SecuritySettingsValidator : AbstractValidator<SecuritySettings>
{
	public const int MinPort = 1;
	public const int MaxPort = 65535;

	/// <summary>
	/// Initializes a new instance of the <see cref="SecuritySettingsValidator"/> class.
	/// </summary>
	public SecuritySettingsValidator()
	{
		RuleFor(security => security.HstsMaxAgeSeconds)
			.GreaterThanOrEqualTo(0)
			.WithMessage("Security:HstsMaxAgeSeconds must be >= 0");

		When(
			security => security.EnforceHttps,
			() =>
			{
				RuleFor(security => security.HttpsPort)
					.InclusiveBetween(MinPort, MaxPort)
					.WithMessage($"Security:HttpsPort must be between {MinPort} and {MaxPort} when HTTPS is enforced");
			});
	}
}
