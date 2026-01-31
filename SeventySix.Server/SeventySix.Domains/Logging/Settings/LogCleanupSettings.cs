// <copyright file="LogCleanupSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Logging;

/// <summary>
/// Configuration for log cleanup background service.
/// Follows TokenCleanupSettings pattern from Identity bounded context.
/// </summary>
public record LogCleanupSettings
{
	/// <summary>
	/// Configuration section name in appsettings.json.
	/// </summary>
	public const string SectionName = "Logging:Cleanup";

	/// <summary>
	/// Gets whether cleanup is enabled. Default: true.
	/// </summary>
	public bool Enabled { get; init; } = true;

	/// <summary>
	/// Gets cleanup interval in hours. Default: 24 (daily).
	/// </summary>
	public int IntervalHours { get; init; } = 24;

	/// <summary>
	/// Gets retention period in days. Default: 7.
	/// Logs (both database and files) older than this are deleted.
	/// </summary>
	public int RetentionDays { get; init; } = 7;

	/// <summary>
	/// Gets initial delay in minutes before first cleanup. Default: 5.
	/// Allows app to fully start before cleanup begins.
	/// </summary>
	public int InitialDelayMinutes { get; init; } = 5;

	/// <summary>
	/// Gets the log file directory relative to app base. Default: "logs".
	/// </summary>
	public string LogDirectory { get; init; } = "logs";

	/// <summary>
	/// Gets the log file pattern for matching. Default: "seventysix-*.txt".
	/// </summary>
	public string LogFilePattern { get; init; } = "seventysix-*.txt";

	/// <summary>
	/// Gets the preferred UTC hour for job execution (0-23).
	/// Default: 8 (3:00 AM EST).
	/// </summary>
	public int PreferredStartHourUtc { get; init; } = 8;

	/// <summary>
	/// Gets the preferred UTC minute for job execution (0-59).
	/// Default: 0.
	/// </summary>
	public int PreferredStartMinuteUtc { get; init; } = 0;
}