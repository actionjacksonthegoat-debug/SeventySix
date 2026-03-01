// <copyright file="ConfigurationSectionConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Constants;

/// <summary>
/// Constants for configuration keys accessed directly via IConfiguration
/// (not bound to a POCO settings record).
/// </summary>
/// <remarks>
/// Settings that bind to POCO records use {RecordType}.SectionName instead.
/// </remarks>
public static class ConfigurationSectionConstants
{
	/// <summary>
	/// Database connection keys accessed individually by ConnectionStringBuilder.
	/// </summary>
	public static class Database
	{
		/// <summary>
		/// Database host setting.
		/// </summary>
		public const string Host = "Database:Host";

		/// <summary>
		/// Database port setting.
		/// </summary>
		public const string Port = "Database:Port";

		/// <summary>
		/// Database name setting.
		/// </summary>
		public const string Name = "Database:Name";

		/// <summary>
		/// Database user setting.
		/// </summary>
		public const string User = "Database:User";

		/// <summary>
		/// Database password setting.
		/// </summary>
		public const string Password = "Database:Password";

		/// <summary>
		/// Database SSL mode setting (optional — Npgsql SSL Mode values: Disable, Prefer, Require, VerifyCA, VerifyFull).
		/// </summary>
		public const string SslMode = "Database:SslMode";
	}

	/// <summary>
	/// Feature flags accessed individually from IConfiguration.
	/// </summary>
	public static class BackgroundJobs
	{
		/// <summary>
		/// Background jobs enabled setting.
		/// </summary>
		public const string Enabled = "BackgroundJobs:Enabled";
	}

	/// <summary>
	/// CORS origins accessed individually for AddCors configuration.
	/// </summary>
	public static class Cors
	{
		/// <summary>
		/// Allowed origins subsection.
		/// </summary>
		public const string AllowedOrigins = "Cors:AllowedOrigins";
	}
}