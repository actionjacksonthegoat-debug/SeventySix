// <copyright file="DatabaseConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Constants;

/// <summary>
/// Constants for database configuration and migrations.
/// </summary>
/// <remarks>
/// Centralizes database-related strings used across contexts.
/// </remarks>
public static class DatabaseConstants
{
	/// <summary>
	/// EF Core migrations history table name.
	/// </summary>
	public const string MigrationsHistoryTableName = "__EFMigrationsHistory";
}