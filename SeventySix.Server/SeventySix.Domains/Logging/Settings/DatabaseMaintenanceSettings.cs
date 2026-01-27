// <copyright file="DatabaseMaintenanceSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Logging;

/// <summary>
/// Configuration for PostgreSQL database maintenance background service.
/// Follows LogCleanupSettings pattern from Logging bounded context.
/// </summary>
public record DatabaseMaintenanceSettings
{
	/// <summary>
	/// Configuration section name in appsettings.json.
	/// </summary>
	public const string SectionName = "Database:Maintenance";

	/// <summary>
	/// Gets whether maintenance is enabled. Default: true.
	/// </summary>
	public bool Enabled { get; init; } = true;

	/// <summary>
	/// Gets maintenance interval in hours. Default: 24 (nightly).
	/// </summary>
	public int IntervalHours { get; init; } = 24;

	/// <summary>
	/// Gets initial delay in minutes before first maintenance. Default: 60.
	/// Allows app to fully start and settle before maintenance begins.
	/// </summary>
	public int InitialDelayMinutes { get; init; } = 60;
}