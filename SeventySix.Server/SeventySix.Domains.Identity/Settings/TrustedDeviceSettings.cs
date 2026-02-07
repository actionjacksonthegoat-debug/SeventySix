// <copyright file="TrustedDeviceSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Trusted device (Remember This Device) configuration settings.
/// Numeric values MUST be configured in appsettings.json.
/// </summary>
public record TrustedDeviceSettings
{
	/// <summary>
	/// Configuration section name in appsettings.json.
	/// </summary>
	public const string SectionName = "TrustedDevices";

	/// <summary>
	/// Gets the trusted device token lifetime in days.
	/// OWASP ASVS V3.3.1 recommends maximum 30 days for device trust.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int TokenLifetimeDays { get; init; }

	/// <summary>
	/// Gets the maximum trusted devices per user.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int MaxDevicesPerUser { get; init; }

	/// <summary>
	/// Gets the cookie name for trusted device token.
	/// Must be configured in appsettings.json.
	/// </summary>
	public string CookieName { get; init; } =
		string.Empty;
}