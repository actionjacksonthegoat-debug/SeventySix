// <copyright file="RefreshTokenCleanupSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity.Settings;

/// <summary>
/// Configuration settings for the refresh token cleanup background job.
/// </summary>
public record RefreshTokenCleanupSettings
{
	/// <summary>
	/// The configuration section name for refresh token cleanup settings.
	/// </summary>
	public const string SectionName = "RefreshTokenCleanup";

	/// <summary>
	/// Gets or sets the interval in hours between cleanup runs.
	/// Default is 24 hours (once per day).
	/// </summary>
	public int IntervalHours { get; set; } = 24;

	/// <summary>
	/// Gets or sets the number of days to retain expired tokens before deletion.
	/// Default is 7 days.
	/// </summary>
	public int RetentionDays { get; set; } = 7;

	/// <summary>
	/// Gets or sets the number of hours to retain used tokens before deletion.
	/// Applies to PasswordResetToken and EmailVerificationToken entities.
	/// Default is 24 hours.
	/// </summary>
	public int UsedTokenRetentionHours { get; set; } = 24;

	/// <summary>
	/// Gets the preferred UTC hour for cleanup (0-23).
	/// Default: 8 (3:20 AM EST when combined with minute).
	/// </summary>
	public int PreferredStartHourUtc { get; init; } = 8;

	/// <summary>
	/// Gets the preferred UTC minute for cleanup (0-59).
	/// Default: 20.
	/// </summary>
	public int PreferredStartMinuteUtc { get; init; } = 20;
}