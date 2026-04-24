// <copyright file="StartupValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging.Abstractions;

namespace SeventySix.Api.Configuration;

/// <summary>
/// Validates required configuration settings on application startup.
/// </summary>
/// <remarks>
/// Thin entry-point that delegates to <see cref="IStartupValidationRule"/> implementations.
/// Each static method maps to one rule; this class exists so existing callers compile
/// without changes. New validation concerns should be added as <see cref="IStartupValidationRule"/>
/// implementations registered in <see cref="WebApplicationExtensions"/>.
/// </remarks>
public static class StartupValidator
{
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
		new SecretsConfigurationValidationRule().Validate(
			configuration,
			environment,
			logger);
	}

	/// <summary>
	/// Validates that AllowedHosts is not a wildcard in production.
	/// </summary>
	/// <param name="configuration">
	/// The application configuration.
	/// </param>
	/// <param name="environment">
	/// The hosting environment.
	/// </param>
	/// <exception cref="InvalidOperationException">
	/// Thrown when AllowedHosts is '*' in production.
	/// </exception>
	public static void ValidateAllowedHosts(
		IConfiguration configuration,
		IHostEnvironment environment)
	{
		new AllowedHostsValidationRule().Validate(
			configuration,
			environment,
			NullLogger.Instance);
	}

	/// <summary>
	/// Validates that security-critical settings are enabled in production.
	/// MFA and TOTP must be enabled; secure cookie settings must be configured.
	/// OAuth is optional and excluded from production validation.
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
	/// Thrown when security settings are misconfigured in production.
	/// </exception>
	public static void ValidateProductionSecuritySettings(
		IConfiguration configuration,
		IHostEnvironment environment,
		ILogger logger)
	{
		new ProductionSecuritySettingsValidationRule().Validate(
			configuration,
			environment,
			logger);
	}
}