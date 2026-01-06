// <copyright file="ConnectionStringBuilder.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Configuration;

/// <summary>
/// Builds database connection strings from configuration.
/// </summary>
/// <remarks>
/// Provides a single source of truth for connection string construction.
/// Builds from Database:* configuration values which are mapped from
/// DB_* environment variables via <see cref="EnvironmentVariableMappingExtensions"/>.
/// </remarks>
public static class ConnectionStringBuilder
{
	/// <summary>
	/// Builds a PostgreSQL connection string from configuration.
	/// </summary>
	/// <remarks>
	/// Builds from Database:Host, Database:Port, Database:Name, Database:User, Database:Password.
	/// These values are mapped from DB_* environment variables loaded from the .env file.
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
		string host = configuration["Database:Host"] ?? "localhost";

		string port = configuration["Database:Port"] ?? "5432";

		string database = configuration["Database:Name"] ?? "seventysix";

		string username = configuration["Database:User"] ?? "postgres";

		string password =
			configuration["Database:Password"]
			?? throw new InvalidOperationException(
				"Database password must be set via DB_PASSWORD environment variable. "
					+ "For local development, ensure .env file exists at repository root "
					+ "with DB_PASSWORD set."
			);

		return $"Host={host};Port={port};Database={database};Username={username};"
			+ $"Password={password};Pooling=true;Minimum Pool Size=5;Maximum Pool Size=100;"
			+ "Connection Lifetime=0;";
	}
}
