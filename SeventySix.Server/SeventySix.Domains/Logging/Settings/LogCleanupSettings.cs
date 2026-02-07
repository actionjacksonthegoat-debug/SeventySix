// <copyright file="LogCleanupSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Logging;

/// <summary>
/// Configuration for log cleanup background service.
/// All values MUST be configured in appsettings.json.
/// </summary>
public record LogCleanupSettings
{
	/// <summary>
	/// Configuration section name in appsettings.json.
	/// </summary>
	public const string SectionName = "Logging:Cleanup";

	/// <summary>
	/// Gets whether cleanup is enabled.
	/// </summary>
	public bool Enabled { get; init; }

	/// <summary>
	/// Gets cleanup interval in hours.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int IntervalHours { get; init; }

	/// <summary>
	/// Gets retention period in days.
	/// Logs (both database and files) older than this are deleted.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int RetentionDays { get; init; }

	/// <summary>
	/// Gets initial delay in minutes before first cleanup.
	/// Allows app to fully start before cleanup begins.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int InitialDelayMinutes { get; init; }

	/// <summary>
	/// Gets the log file directory relative to app base.
	/// Must be configured in appsettings.json.
	/// </summary>
	public string LogDirectory { get; init; } =
		string.Empty;

	/// <summary>
	/// Gets the log file pattern for matching.
	/// Must be configured in appsettings.json.
	/// </summary>
	public string LogFilePattern { get; init; } =
		string.Empty;

	/// <summary>
	/// Gets the preferred UTC hour for job execution (0-23).
	/// Must be configured in appsettings.json.
	/// </summary>
	public int PreferredStartHourUtc { get; init; }

	/// <summary>
	/// Gets the preferred UTC minute for job execution (0-59).
	/// Must be configured in appsettings.json.
	/// </summary>
	public int PreferredStartMinuteUtc { get; init; }
}