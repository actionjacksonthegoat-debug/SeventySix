// <copyright file="MfaSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// MFA configuration settings bound from appsettings.json.
/// All numeric values MUST be configured in appsettings.json.
/// </summary>
public record MfaSettings
{
	/// <summary>
	/// Configuration section name.
	/// </summary>
	public const string SectionName = "Mfa";

	/// <summary>
	/// Gets a value indicating whether MFA is globally enabled.
	/// </summary>
	public bool Enabled { get; init; }

	/// <summary>
	/// Gets a value indicating whether MFA is required for all users (admin enforcement).
	/// </summary>
	public bool RequiredForAllUsers { get; init; }

	/// <summary>
	/// Gets the verification code length.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int CodeLength { get; init; }

	/// <summary>
	/// Gets code expiration in minutes.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int CodeExpirationMinutes { get; init; }

	/// <summary>
	/// Gets max verification attempts per challenge.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int MaxAttempts { get; init; }

	/// <summary>
	/// Gets cooldown between resend requests in seconds.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int ResendCooldownSeconds { get; init; }
}