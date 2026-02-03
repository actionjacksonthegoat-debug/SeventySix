// <copyright file="ConfigurationSectionConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Constants;

/// <summary>
/// Constants for configuration section names.
/// Single source of truth to prevent typos and enable refactoring (DRY).
/// </summary>
public static class ConfigurationSectionConstants
{
	/// <summary>
	/// Database configuration section.
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
	}

	/// <summary>
	/// JWT settings section.
	/// </summary>
	public const string Jwt = "Jwt";

	/// <summary>
	/// Auth settings section.
	/// </summary>
	public const string Auth = "Auth";

	/// <summary>
	/// Security settings section.
	/// </summary>
	public const string Security = "Security";

	/// <summary>
	/// Email settings section.
	/// </summary>
	public const string Email = "Email";

	/// <summary>
	/// Rate limiting settings section.
	/// </summary>
	public const string RateLimiting = "RateLimiting";

	/// <summary>
	/// Request limits settings section for DoS protection.
	/// </summary>
	public const string RequestLimits = "RequestLimits";

	/// <summary>
	/// Cache settings section.
	/// </summary>
	public const string Cache = "Cache";

	/// <summary>
	/// Background jobs settings section.
	/// </summary>
	public static class BackgroundJobs
	{
		/// <summary>
		/// Background jobs enabled setting.
		/// </summary>
		public const string Enabled = "BackgroundJobs:Enabled";
	}

	/// <summary>
	/// CORS settings section.
	/// </summary>
	public static class Cors
	{
		/// <summary>
		/// Allowed origins subsection.
		/// </summary>
		public const string AllowedOrigins = "Cors:AllowedOrigins";
	}

	/// <summary>
	/// Auth nested sections.
	/// </summary>
	public static class AuthNested
	{
		/// <summary>
		/// Auth rate limit subsection.
		/// </summary>
		public const string RateLimit = "Auth:RateLimit";
	}
}