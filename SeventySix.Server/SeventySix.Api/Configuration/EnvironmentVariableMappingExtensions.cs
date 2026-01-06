// <copyright file="EnvironmentVariableMappingExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Configuration;

/// <summary>
/// Extension methods for mapping flat environment variables to hierarchical configuration.
/// </summary>
/// <remarks>
/// Enables .env files to use simple variable names (JWT_SECRET_KEY) which are then
/// mapped to ASP.NET Core's hierarchical configuration (Jwt:SecretKey).
/// This creates a single source of truth for secrets via the .env file.
/// </remarks>
public static class EnvironmentVariableMappingExtensions
{
	/// <summary>
	/// Environment variable mappings from flat .env format to hierarchical configuration.
	/// </summary>
	/// <remarks>
	/// Maps simple environment variable names to ASP.NET Core's colon-separated
	/// hierarchical configuration keys. Array indices use numeric keys (e.g., 0, 1).
	/// </remarks>
	private static readonly Dictionary<
		string,
		string
	> EnvironmentVariableMappings = new(StringComparer.OrdinalIgnoreCase)
	{
		// Database
		["DB_NAME"] = "Database:Name",
		["DB_USER"] = "Database:User",
		["DB_PASSWORD"] = "Database:Password",

		// JWT Authentication
		["JWT_SECRET_KEY"] = "Jwt:SecretKey",

		// GitHub OAuth
		["GITHUB_CLIENT_ID"] = "Auth:OAuth:Providers:0:ClientId",
		["GITHUB_CLIENT_SECRET"] = "Auth:OAuth:Providers:0:ClientSecret",

		// Email (Brevo)
		["EMAIL_SMTP_USERNAME"] = "Email:SmtpUsername",
		["EMAIL_SMTP_PASSWORD"] = "Email:SmtpPassword",
		["EMAIL_FROM_ADDRESS"] = "Email:FromAddress",

		// Admin Seeding
		["ADMIN_EMAIL"] = "AdminSeeder:Email",
		["ADMIN_PASSWORD"] = "AdminSeeder:InitialPassword",

		// Data Protection
		["DATA_PROTECTION_USE_CERTIFICATE"] = "DataProtection:UseCertificate",
		["DATA_PROTECTION_CERTIFICATE_PATH"] = "DataProtection:CertificatePath",
		["DATA_PROTECTION_CERTIFICATE_PASSWORD"] = "DataProtection:CertificatePassword",
		["DATA_PROTECTION_KEYS_DIRECTORY"] = "DataProtection:KeysDirectory",
		["DATA_PROTECTION_ALLOW_UNPROTECTED_DEV"] = "DataProtection:AllowUnprotectedKeysInDevelopment",
	};

	/// <summary>
	/// Adds environment variable mapping to the configuration builder.
	/// </summary>
	/// <remarks>
	/// Reads flat environment variables and maps them to hierarchical configuration.
	/// This should be called after WebApplication.CreateBuilder to ensure environment
	/// variables override appsettings.json values.
	/// </remarks>
	/// <param name="configuration">
	/// The configuration manager to add mappings to.
	/// </param>
	/// <returns>
	/// The configuration manager for method chaining.
	/// </returns>
	public static ConfigurationManager AddEnvironmentVariableMapping(
		this ConfigurationManager configuration
	)
	{
		Dictionary<string, string?> mappedValues = [];

		foreach (
			KeyValuePair<string, string> mapping in EnvironmentVariableMappings
		)
		{
			string? environmentValue = Environment.GetEnvironmentVariable(
				mapping.Key
			);

			if (!string.IsNullOrEmpty(environmentValue))
			{
				mappedValues[mapping.Value] = environmentValue;
			}
		}

		if (mappedValues.Count > 0)
		{
			configuration.AddInMemoryCollection(mappedValues);
		}

		return configuration;
	}
}
