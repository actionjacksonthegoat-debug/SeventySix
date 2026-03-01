// <copyright file="ConnectionStringBuilder.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Constants;
using SeventySix.Shared.Exceptions;

namespace SeventySix.Api.Configuration;

/// <summary>
/// Builds database connection strings from configuration.
/// </summary>
/// <remarks>
/// Provides a single source of truth for connection string construction.
/// Builds from Database:* configuration values provided via User Secrets
/// (Development), appsettings (Test/E2E), or environment variables (Production).
/// </remarks>
public static class ConnectionStringBuilder
{
	/// <summary>
	/// Builds a PostgreSQL connection string from configuration.
	/// </summary>
	/// <remarks>
	/// Builds from Database:Host, Database:Port, Database:Name, Database:User, Database:Password.
	/// These values are provided via User Secrets (Development), appsettings (Test/E2E),
	/// or environment variables (Production).
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
		IConfiguration configuration)
	{
		string host =
			configuration[ConfigurationSectionConstants.Database.Host]
			?? throw new RequiredConfigurationException(ConfigurationSectionConstants.Database.Host);

		string port =
			configuration[ConfigurationSectionConstants.Database.Port]
			?? throw new RequiredConfigurationException(ConfigurationSectionConstants.Database.Port);

		string database =
			configuration[ConfigurationSectionConstants.Database.Name]
			?? throw new RequiredConfigurationException(ConfigurationSectionConstants.Database.Name);

		string username =
			configuration[ConfigurationSectionConstants.Database.User]
			?? throw new RequiredConfigurationException(ConfigurationSectionConstants.Database.User);

		string password =
			configuration[ConfigurationSectionConstants.Database.Password]
			?? throw new RequiredConfigurationException(ConfigurationSectionConstants.Database.Password);

		string? sslMode =
			configuration[ConfigurationSectionConstants.Database.SslMode];

		string connectionString =
			$"Host={host};Port={port};Database={database};Username={username};"
			+ $"Password={password};Pooling=true;Minimum Pool Size=5;Maximum Pool Size=100;"
			+ "Connection Lifetime=0;";

		if (!string.IsNullOrWhiteSpace(sslMode))
		{
			connectionString += $"SSL Mode={sslMode};Trust Server Certificate=true;";
		}

		return connectionString;
	}
}