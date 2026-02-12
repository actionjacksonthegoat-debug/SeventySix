// <copyright file="OrphanedRegistrationCleanupSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity.Settings;

/// <summary>
/// Settings for the orphaned registration user cleanup job.
/// </summary>
public sealed record OrphanedRegistrationCleanupSettings
{
	/// <summary>
	/// Gets the configuration section name.
	/// </summary>
	public const string SectionName = "OrphanedRegistrationCleanup";

	/// <summary>
	/// Gets the number of hours before an unconfirmed user is considered orphaned.
	/// </summary>
	public int RetentionHours { get; init; } = 48;

	/// <summary>
	/// Gets the interval in hours between cleanup runs.
	/// </summary>
	public int IntervalHours { get; init; } = 24;

	/// <summary>
	/// Gets the preferred UTC hour to start the job.
	/// </summary>
	public int PreferredStartHourUtc { get; init; }

	/// <summary>
	/// Gets the preferred UTC minute to start the job.
	/// </summary>
	public int PreferredStartMinuteUtc { get; init; }
}