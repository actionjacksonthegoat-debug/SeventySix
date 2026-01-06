// <copyright file="ConnectionStringBuilder.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Configuration;

/// <summary>
/// Builds database connection strings from configuration or environment variables.
/// </summary>
/// <remarks>
/// Provides a single source of truth for connection string construction.
/// Supports both explicit connection strings and component-based building from
/// individual Database:* configuration values or DB_* environment variables.
/// </remarks>
public static class ConnectionStringBuilder
{
	/// <summary>
	/// Placeholder text indicating a value should come from secrets.
	/// </summary>
	private const string PlaceholderMarker = "PLACEHOLDER";

	/// <summary>
	/// Builds a PostgreSQL connection string from configuration.
	/// </summary>
	/// <remarks>
	/// Priority order:
	/// 1. Explicit ConnectionStrings:DefaultConnection (if not a placeholder)
	/// 2. Built from Database:Host, Database:Port, Database:Name, Database:User, Database:Password
	/// 3. Falls back to localhost defaults with required password from environment.
	/// </remarks>
	/// <param name="configuration">
	/// The application configuration.
	/// </param>
	/// <returns>
	/// A valid PostgreSQL connection string.
	/// </returns>
	/// <exception cref="InvalidOperationException">
	/// Thrown when database password is not configured.
	/// </exception>
	public static string BuildPostgresConnectionString(
		IConfiguration configuration
	)
	{
		// First, check for explicit connection string that's not a placeholder
		string? explicitConnectionString =
			configuration.GetConnectionString(
				"DefaultConnection");

		if (
			!string.IsNullOrEmpty(explicitConnectionString)
			&& !explicitConnectionString.Contains(
				PlaceholderMarker,
				StringComparison.OrdinalIgnoreCase
			)
		)
		{
			return explicitConnectionString;
		}

		// Build from individual components
		string host = configuration["Database:Host"] ?? "localhost";

		string port = configuration["Database:Port"] ?? "5432";

		string database = configuration["Database:Name"] ?? "seventysix";

		string username = configuration["Database:User"] ?? "postgres";

		string password =
			configuration["Database:Password"]
			?? throw new InvalidOperationException(
				"Database password must be set via DB_PASSWORD environment variable "
					+ "or Database:Password configuration. "
					+ "For local development, ensure .env file exists with DB_PASSWORD set."
			);

		return $"Host={host};Port={port};Database={database};Username={username};"
			+ $"Password={password};Pooling=true;Minimum Pool Size=5;Maximum Pool Size=100;"
			+ "Connection Lifetime=0;";
	}
}
