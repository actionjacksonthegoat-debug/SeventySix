// <copyright file="CartSessionCleanupSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.EcommerceCleanup.Settings;

/// <summary>
/// Configuration settings for the cart session cleanup background job.
/// Determines how often and how aggressively abandoned cart sessions are cleaned up.
/// </summary>
public sealed record CartSessionCleanupSettings
{
	/// <summary>
	/// Gets the number of days to retain expired cart sessions before deletion.
	/// Cart sessions past their <c>expires_at</c> timestamp plus this buffer are removed.
	/// Must be between 1 and 365.
	/// </summary>
	public int RetentionDays { get; init; }

	/// <summary>
	/// Gets the interval in hours between cleanup runs.
	/// Must be between 1 and 744 (31 days).
	/// </summary>
	public int IntervalHours { get; init; }

	/// <summary>
	/// Gets the preferred UTC hour for cleanup (0-23).
	/// </summary>
	public int PreferredStartHourUtc { get; init; }

	/// <summary>
	/// Gets the preferred UTC minute for cleanup (0-59).
	/// </summary>
	public int PreferredStartMinuteUtc { get; init; }
}