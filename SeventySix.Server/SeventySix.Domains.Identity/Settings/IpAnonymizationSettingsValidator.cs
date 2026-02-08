// <copyright file="IpAnonymizationSettingsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity.Settings;

/// <summary>
/// Validates <see cref="IpAnonymizationSettings"/> configuration values.
/// </summary>
public sealed class IpAnonymizationSettingsValidator : AbstractValidator<IpAnonymizationSettings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="IpAnonymizationSettingsValidator"/> class.
	/// </summary>
	public IpAnonymizationSettingsValidator()
	{
		RuleFor(anonymization => anonymization.IntervalDays)
			.InclusiveBetween(1, 30)
			.WithMessage("IpAnonymization:IntervalDays must be between 1 and 30");

		RuleFor(anonymization => anonymization.RetentionDays)
			.InclusiveBetween(1, 365)
			.WithMessage("IpAnonymization:RetentionDays must be between 1 and 365");
	}
}