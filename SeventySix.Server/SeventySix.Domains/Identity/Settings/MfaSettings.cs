// <copyright file="MfaSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// MFA configuration settings bound from appsettings.json.
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
	public bool Enabled { get; init; } = false;

	/// <summary>
	/// Gets a value indicating whether MFA is required for all users (admin enforcement).
	/// </summary>
	public bool RequiredForAllUsers { get; init; } = false;

	/// <summary>
	/// Gets the verification code length. Default: 6 digits.
	/// </summary>
	public int CodeLength { get; init; } = 6;

	/// <summary>
	/// Gets code expiration in minutes. Default: 5 (OWASP recommendation).
	/// </summary>
	public int CodeExpirationMinutes { get; init; } = 5;

	/// <summary>
	/// Gets max verification attempts per challenge. Default: 5.
	/// </summary>
	public int MaxAttempts { get; init; } = 5;

	/// <summary>
	/// Gets cooldown between resend requests in seconds. Default: 60.
	/// </summary>
	public int ResendCooldownSeconds { get; init; } = 60;
}