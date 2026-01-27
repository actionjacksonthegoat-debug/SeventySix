// <copyright file="BackupCodeSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Backup code configuration settings bound from appsettings.json.
/// </summary>
public record BackupCodeSettings
{
	/// <summary>
	/// Configuration section name.
	/// </summary>
	public const string SectionName = "BackupCodes";

	/// <summary>
	/// Gets the number of backup codes to generate. Default: 10.
	/// </summary>
	public int CodeCount { get; init; } = 10;

	/// <summary>
	/// Gets the backup code length. Default: 8.
	/// </summary>
	public int CodeLength { get; init; } = 8;
}