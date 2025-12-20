// <copyright file="DatabaseConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Constants;

/// <summary>
/// Constants for database configuration and migrations.
/// </summary>
/// <remarks>
/// Centralizes database-related strings used across contexts.
/// These constants ensure consistency in migrations history tables and connection strings.
/// </remarks>
public static class DatabaseConstants
{
	/// <summary>
	/// EF Core migrations history table name.
	/// </summary>
	public const string MigrationsHistoryTableName = "__EFMigrationsHistory";

	/// <summary>
	/// Design-time placeholder connection string for EF Core tooling.
	/// </summary>
	/// <remarks>
	/// Used ONLY for migrations generation (schema-only operations).
	/// Actual runtime connection strings come from appsettings.json.
	/// </remarks>
	public const string DesignTimeConnectionString =
		"Host=localhost;Port=5432;Database=seventysix;Username=postgres;Password=TestPassword;Pooling=true;Minimum Pool Size=5;Maximum Pool Size=100;Connection Lifetime=0;";
}
