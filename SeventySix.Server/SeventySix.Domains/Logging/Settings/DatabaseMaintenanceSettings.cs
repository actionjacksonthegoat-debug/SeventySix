// <copyright file="DatabaseMaintenanceSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Logging;

/// <summary>
/// Configuration for PostgreSQL database maintenance background service.
/// All values MUST be configured in appsettings.json.
/// </summary>
public record DatabaseMaintenanceSettings
{
	/// <summary>
	/// Configuration section name in appsettings.json.
	/// </summary>
	public const string SectionName = "Database:Maintenance";

	/// <summary>
	/// Gets whether maintenance is enabled.
	/// </summary>
	public bool Enabled { get; init; }

	/// <summary>
	/// Gets maintenance interval in hours.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int IntervalHours { get; init; }

	/// <summary>
	/// Gets initial delay in minutes before first maintenance.
	/// Allows app to fully start and settle before maintenance begins.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int InitialDelayMinutes { get; init; }

	/// <summary>
	/// Gets the preferred UTC hour for maintenance (0-23).
	/// Must be configured in appsettings.json.
	/// </summary>
	public int PreferredStartHourUtc { get; init; }

	/// <summary>
	/// Gets the preferred UTC minute for maintenance (0-59).
	/// Must be configured in appsettings.json.
	/// </summary>
	public int PreferredStartMinuteUtc { get; init; }
}