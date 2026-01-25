// <copyright file="TrustedDeviceSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Trusted device (Remember This Device) configuration settings.
/// </summary>
public record TrustedDeviceSettings
{
	/// <summary>
	/// Configuration section name in appsettings.json.
	/// </summary>
	public const string SectionName = "TrustedDevices";

	/// <summary>
	/// Gets the trusted device token lifetime in days. Default: 30.
	/// </summary>
	/// <remarks>
	/// OWASP ASVS V3.3.1 recommends maximum 30 days for device trust.
	/// </remarks>
	public int TokenLifetimeDays { get; init; } = 30;

	/// <summary>
	/// Gets the maximum trusted devices per user. Default: 5.
	/// </summary>
	public int MaxDevicesPerUser { get; init; } = 5;

	/// <summary>
	/// Gets the cookie name for trusted device token.
	/// </summary>
	public string CookieName { get; init; } = "__TD";
}