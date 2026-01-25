// <copyright file="StartupValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SeventySix.Shared.Constants;

namespace SeventySix.Api.Configuration;

/// <summary>
/// Validates required configuration settings on application startup.
/// </summary>
/// <remarks>
/// Performs early validation of critical settings to fail fast with clear error messages.
/// Runs during application startup in Production environment only.
/// </remarks>
public static class StartupValidator
{
	/// <summary>
	/// List of configuration keys that must have non-placeholder values in production.
	/// </summary>
	private static readonly string[] RequiredSecrets =
	[
		"Jwt:SecretKey",
		"Database:Password",
		"Auth:OAuth:Providers:0:ClientId",
		"Auth:OAuth:Providers:0:ClientSecret",
		"Email:SmtpUsername",
		"Email:SmtpPassword",
		"Email:FromAddress",
		"Altcha:HmacKeyBase64"
	];

	/// <summary>
	/// Placeholder prefix that indicates a value has not been configured.
	/// </summary>
	private const string PlaceholderPrefix = "PLACEHOLDER_";

	/// <summary>
	/// Validates required configuration settings.
	/// </summary>
	/// <param name="configuration">
	/// The application configuration.
	/// </param>
	/// <param name="environment">
	/// The hosting environment.
	/// </param>
	/// <param name="logger">
	/// The logger for reporting validation results.
	/// </param>
	/// <exception cref="InvalidOperationException">
	/// Thrown when required settings are missing or have placeholder values in production.
	/// </exception>
	public static void ValidateConfiguration(
		IConfiguration configuration,
		IHostEnvironment environment,
		ILogger logger)
	{
		ArgumentNullException.ThrowIfNull(configuration);
		ArgumentNullException.ThrowIfNull(environment);
		ArgumentNullException.ThrowIfNull(logger);

		// Only enforce strict validation in production
		if (!environment.IsProduction())
		{
			logger.LogInformation(
				"Skipping startup configuration validation in {Environment} environment",
				environment.EnvironmentName);
			return;
		}

		List<string> missingSettings = [];
		List<string> placeholderSettings = [];

		foreach (string key in RequiredSecrets)
		{
			string? value = configuration[key];

			if (string.IsNullOrWhiteSpace(value))
			{
				missingSettings.Add(key);
			}
			else if (value.StartsWith(
				PlaceholderPrefix,
				StringComparison.OrdinalIgnoreCase))
			{
				placeholderSettings.Add(key);
			}
		}

		if (missingSettings.Count > 0 || placeholderSettings.Count > 0)
		{
			LogValidationErrors(
				logger,
				missingSettings,
				placeholderSettings);

			throw new InvalidOperationException(
				$"Configuration validation failed. Missing: [{string.Join(", ", missingSettings)}]. " +
				$"Placeholder values: [{string.Join(", ", placeholderSettings)}]. " +
				"See logs for details.");
		}

		logger.LogInformation(
			"Startup configuration validation passed for {Count} required settings",
			RequiredSecrets.Length);
	}

	/// <summary>
	/// Logs detailed validation errors.
	/// </summary>
	/// <param name="logger">
	/// The logger.
	/// </param>
	/// <param name="missingSettings">
	/// Settings with missing values.
	/// </param>
	/// <param name="placeholderSettings">
	/// Settings with placeholder values.
	/// </param>
	private static void LogValidationErrors(
		ILogger logger,
		List<string> missingSettings,
		List<string> placeholderSettings)
	{
		if (missingSettings.Count > 0)
		{
			logger.LogError(
				"Missing required configuration settings: {MissingSettings}",
				string.Join(", ", missingSettings));
		}

		if (placeholderSettings.Count > 0)
		{
			logger.LogError(
				"Configuration settings still have placeholder values: {PlaceholderSettings}",
				string.Join(", ", placeholderSettings));
		}

		logger.LogError(
			"Ensure all required secrets are configured via environment variables or .env file. " +
			"See .env.example for the complete list of required variables.");
	}
}
