// <copyright file="ApiTrackingRetentionSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ApiTracking;

/// <summary>
/// Configuration for API tracking data retention background job.
/// </summary>
public sealed record ApiTrackingRetentionSettings
{
	/// <summary>
	/// Configuration section name in appsettings.json.
	/// </summary>
	public const string SectionName = "ApiTracking:Retention";

	/// <summary>
	/// Gets whether retention cleanup is enabled.
	/// </summary>
	public bool Enabled { get; init; }

	/// <summary>
	/// Gets the cleanup interval in hours.
	/// </summary>
	public int IntervalHours { get; init; }

	/// <summary>
	/// Gets the retention period in days.
	/// Records older than this are deleted.
	/// </summary>
	public int RetentionDays { get; init; }

	/// <summary>
	/// Gets the preferred UTC hour for job execution (0-23).
	/// </summary>
	public int PreferredStartHourUtc { get; init; }

	/// <summary>
	/// Gets the preferred UTC minute for job execution (0-59).
	/// </summary>
	public int PreferredStartMinuteUtc { get; init; }
}
