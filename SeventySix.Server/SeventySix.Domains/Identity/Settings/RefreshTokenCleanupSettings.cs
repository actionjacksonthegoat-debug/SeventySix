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
}
