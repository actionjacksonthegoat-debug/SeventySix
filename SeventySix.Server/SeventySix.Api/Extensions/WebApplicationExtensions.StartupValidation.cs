// <copyright file="WebApplicationExtensions.StartupValidation.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Api.Configuration;

namespace SeventySix.Api.Extensions;

/// <summary>
/// Startup validation extensions — runs all <see cref="IStartupValidationRule"/> implementations
/// and dependency connectivity checks before the pipeline is configured.
/// </summary>
public static partial class WebApplicationExtensions
{
	/// <summary>
	/// Runs all registered startup validation rules and dependency connectivity checks.
	/// Each rule validates a specific configuration concern; in Production, any failure
	/// throws an <see cref="InvalidOperationException"/> to fail fast with a clear message.
	/// </summary>
	/// <param name="app">
	/// The web application being started.
	/// </param>
	/// <returns>
	/// A task that completes after all validation passes.
	/// </returns>
	/// <exception cref="InvalidOperationException">
	/// Thrown when any validation rule detects a misconfiguration in production.
	/// </exception>
	public static async Task UseStartupValidationAsync(this WebApplication app)
	{
		ILogger logger =
			app.Services.GetRequiredService<ILogger<WebApplication>>();

		IStartupValidationRule[] rules =
			[
			new SecretsConfigurationValidationRule(),
			new AllowedHostsValidationRule(),
			new ProductionSecuritySettingsValidationRule(),
			];

		foreach (IStartupValidationRule rule in rules)
		{
			rule.Validate(
				app.Configuration,
				app.Environment,
				logger);
		}

		await app.ValidateDependenciesAsync(app.Configuration);
	}
}