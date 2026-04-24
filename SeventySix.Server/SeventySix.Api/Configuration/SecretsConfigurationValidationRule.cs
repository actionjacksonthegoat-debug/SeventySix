// <copyright file="SecretsConfigurationValidationRule.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Configuration;

/// <summary>
/// Validates that required secret configuration keys have non-missing,
/// non-placeholder values.
/// </summary>
internal sealed class SecretsConfigurationValidationRule : IStartupValidationRule
{
	/// <summary>
	/// Configuration keys that must have non-placeholder values.
	/// Validated as warnings in non-Production, errors in Production.
	/// </summary>
	internal static readonly string[] RequiredSecrets =
		[
		"Jwt:SecretKey",
		"Database:Password",
		"Auth:OAuth:Providers:0:ClientId",
		"Auth:OAuth:Providers:0:ClientSecret",
		"Email:ApiKey",
		"Email:FromAddress",
		"Altcha:HmacKeyBase64",
		"Site:Email",
		];

	/// <summary>
	/// Placeholder prefix that indicates a value has not been configured.
	/// </summary>
	private const string PlaceholderPrefix = "PLACEHOLDER_";

	/// <inheritdoc />
	public void Validate(
		IConfiguration configuration,
		IHostEnvironment environment,
		ILogger logger)
	{
		ArgumentNullException.ThrowIfNull(configuration);
		ArgumentNullException.ThrowIfNull(environment);
		ArgumentNullException.ThrowIfNull(logger);

		List<string> missingSettings = [];
		List<string> placeholderSettings = [];

		foreach (string key in RequiredSecrets)
		{
			string? value =
				configuration[key];

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

		// Non-Production: warn about missing secrets without failing startup
		if (!environment.IsProduction())
		{
			List<string> allMissing =
				[.. missingSettings, .. placeholderSettings];

			if (allMissing.Count > 0)
			{
				logger.LogWarning(
					"Configuration keys not set: {MissingKeys}. "
						+ "Set via User Secrets: 'npm run secrets:set -- -Key \"{{Key}}\" -Value \"{{Value}}\"'",
					string.Join(", ", allMissing));
			}
			else
			{
				logger.LogInformation(
					"Startup configuration validation passed for {Count} required settings",
					RequiredSecrets.Length);
			}

			return;
		}

		// Production: strict validation — fail fast on missing or placeholder values
		if (missingSettings.Count > 0 || placeholderSettings.Count > 0)
		{
			LogValidationErrors(
				logger,
				missingSettings,
				placeholderSettings);

			throw new InvalidOperationException(
				$"Configuration validation failed. Missing: [{string.Join(", ", missingSettings)}]. "
				+ $"Placeholder values: [{string.Join(", ", placeholderSettings)}]. "
				+ "See logs for details.");
		}

		logger.LogInformation(
			"Startup configuration validation passed for {Count} required settings",
			RequiredSecrets.Length);
	}

	/// <summary>
	/// Logs detailed validation errors for missing and placeholder settings.
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
			"Ensure all required secrets are configured via User Secrets (Development), "
			+ "appsettings.{{Environment}}.json (Test/E2E), or environment variables (Production). "
			+ "Run 'npm run secrets:init' to initialize Development secrets.");
	}
}