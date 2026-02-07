// <copyright file="BackupCodeSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Backup code configuration settings bound from appsettings.json.
/// All values MUST be configured in appsettings.json.
/// </summary>
public record BackupCodeSettings
{
	/// <summary>
	/// Configuration section name.
	/// </summary>
	public const string SectionName = "BackupCodes";

	/// <summary>
	/// Gets the number of backup codes to generate.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int CodeCount { get; init; }

	/// <summary>
	/// Gets the backup code length.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int CodeLength { get; init; }
}