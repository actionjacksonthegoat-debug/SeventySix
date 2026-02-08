// <copyright file="TrustedDeviceSettingsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity;

/// <summary>
/// Validates <see cref="TrustedDeviceSettings"/> configuration values.
/// </summary>
public sealed class TrustedDeviceSettingsValidator : AbstractValidator<TrustedDeviceSettings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="TrustedDeviceSettingsValidator"/> class.
	/// </summary>
	public TrustedDeviceSettingsValidator()
	{
		RuleFor(device => device.TokenLifetimeDays)
			.InclusiveBetween(1, 90)
			.WithMessage("TrustedDevices:TokenLifetimeDays must be between 1 and 90");

		RuleFor(device => device.MaxDevicesPerUser)
			.InclusiveBetween(1, 20)
			.WithMessage("TrustedDevices:MaxDevicesPerUser must be between 1 and 20");

		RuleFor(device => device.CookieName)
			.NotEmpty()
			.WithMessage("TrustedDevices:CookieName is required");
	}
}
