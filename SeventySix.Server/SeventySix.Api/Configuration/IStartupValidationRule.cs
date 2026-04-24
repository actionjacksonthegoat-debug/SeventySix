// <copyright file="IStartupValidationRule.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Configuration;

/// <summary>
/// Validates a specific configuration concern at application startup.
/// </summary>
/// <remarks>
/// Implement this interface to add new startup validation rules.
/// Register each rule in <see cref="WebApplicationExtensions"/> to include it
/// in the startup validation pipeline. This follows the Open/Closed Principle —
/// adding a rule does not require changing the entry point.
/// </remarks>
internal interface IStartupValidationRule
{
	/// <summary>
	/// Runs the validation for a specific configuration concern.
	/// In Production, throws <see cref="InvalidOperationException"/> on failure.
	/// In non-Production, logs a warning.
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
	/// Thrown when required settings are invalid in production.
	/// </exception>
	public void Validate(
		IConfiguration configuration,
		IHostEnvironment environment,
		ILogger logger);
}