// <copyright file="EmailQueueRetentionSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ElectronicNotifications.Emails;

/// <summary>
/// Configuration for email queue data retention background job.
/// Only deletes <c>Sent</c> and <c>Failed</c> entries; never touches <c>Pending</c> or <c>Processing</c>.
/// </summary>
public sealed record EmailQueueRetentionSettings
{
	/// <summary>
	/// Configuration section name in appsettings.json.
	/// </summary>
	public const string SectionName = "Email:Retention";

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
	/// Sent and Failed entries older than this are deleted.
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