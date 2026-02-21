// <copyright file="RefreshTokenCleanupSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity.Settings;

/// <summary>
/// Configuration settings for the refresh token cleanup background job.
/// All values MUST be configured in appsettings.json.
/// </summary>
public sealed record RefreshTokenCleanupSettings
{
	/// <summary>
	/// The configuration section name for refresh token cleanup settings.
	/// </summary>
	public const string SectionName = "RefreshTokenCleanup";

	/// <summary>
	/// Gets the interval in hours between cleanup runs.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int IntervalHours { get; init; }

	/// <summary>
	/// Gets the number of days to retain expired tokens before deletion.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int RetentionDays { get; init; }

	/// <summary>
	/// Gets the number of hours to retain used tokens before deletion.
	/// Applies to PasswordResetToken and EmailVerificationToken entities.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int UsedTokenRetentionHours { get; init; }

	/// <summary>
	/// Gets the preferred UTC hour for cleanup (0-23).
	/// Must be configured in appsettings.json.
	/// </summary>
	public int PreferredStartHourUtc { get; init; }

	/// <summary>
	/// Gets the preferred UTC minute for cleanup (0-59).
	/// Must be configured in appsettings.json.
	/// </summary>
	public int PreferredStartMinuteUtc { get; init; }
}