// <copyright file="PortConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Constants;

/// <summary>
/// Port allocation constants for all environments.
/// Single source of truth for port assignments (DRY).
/// </summary>
public static class PortConstants
{
	/// <summary>
	/// Development environment ports.
	/// </summary>
	public static class Development
	{
		/// <summary>
		/// API HTTPS port.
		/// </summary>
		public const int ApiHttps = 7074;

		/// <summary>
		/// Angular client port.
		/// </summary>
		public const int Client = 4200;

		/// <summary>
		/// PostgreSQL exposed port.
		/// </summary>
		public const int PostgreSql = 5433;

		/// <summary>
		/// Valkey/Redis port.
		/// </summary>
		public const int Valkey = 6379;

		/// <summary>
		/// Grafana HTTPS proxy port.
		/// </summary>
		public const int Grafana = 3443;

		/// <summary>
		/// Prometheus HTTPS proxy port.
		/// </summary>
		public const int Prometheus = 9091;

		/// <summary>
		/// Jaeger HTTPS proxy port.
		/// </summary>
		public const int Jaeger = 16687;

		/// <summary>
		/// pgAdmin HTTPS proxy port.
		/// </summary>
		public const int PgAdmin = 5051;

		/// <summary>
		/// RedisInsight HTTPS proxy port for Valkey cache visualization.
		/// </summary>
		public const int RedisInsight = 5541;
	}

	/// <summary>
	/// E2E test environment ports (isolated from development).
	/// </summary>
	public static class E2E
	{
		/// <summary>
		/// API HTTPS port (dev + 100).
		/// </summary>
		public const int ApiHttps = 7174;

		/// <summary>
		/// Angular client port (dev + 1).
		/// </summary>
		public const int Client = 4201;

		/// <summary>
		/// PostgreSQL exposed port (dev + 1).
		/// </summary>
		public const int PostgreSql = 5434;

		/// <summary>
		/// Valkey/Redis port (dev + 1).
		/// </summary>
		public const int Valkey = 6380;

		/// <summary>
		/// MailDev web UI port.
		/// </summary>
		public const int MailDevWeb = 1080;

		/// <summary>
		/// MailDev SMTP port.
		/// </summary>
		public const int MailDevSmtp = 1025;
	}

	/// <summary>
	/// Container internal ports (not exposed to host).
	/// </summary>
	public static class Container
	{
		/// <summary>
		/// Internal HTTPS port for API containers.
		/// </summary>
		public const int ApiHttps = 8081;

		/// <summary>
		/// Internal HTTP port for client containers.
		/// </summary>
		public const int ClientHttp = 8080;

		/// <summary>
		/// Internal PostgreSQL port.
		/// </summary>
		public const int PostgreSql = 5432;

		/// <summary>
		/// Internal Valkey/Redis port.
		/// </summary>
		public const int Valkey = 6379;
	}
}