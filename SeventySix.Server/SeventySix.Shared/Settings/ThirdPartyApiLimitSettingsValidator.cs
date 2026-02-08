// <copyright file="ThirdPartyApiLimitSettingsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Shared;

/// <summary>
/// Validates <see cref="ThirdPartyApiLimitSettings"/> configuration values.
/// </summary>
public sealed class ThirdPartyApiLimitSettingsValidator : AbstractValidator<ThirdPartyApiLimitSettings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="ThirdPartyApiLimitSettingsValidator"/> class.
	/// </summary>
	public ThirdPartyApiLimitSettingsValidator()
	{
		RuleFor(apiLimit => apiLimit.DefaultDailyLimit)
			.GreaterThan(0)
			.WithMessage("ThirdPartyApiLimits:DefaultDailyLimit must be greater than 0");

		RuleFor(apiLimit => apiLimit.DefaultMonthlyLimit)
			.GreaterThan(0)
			.WithMessage("ThirdPartyApiLimits:DefaultMonthlyLimit must be greater than 0");
	}
}
