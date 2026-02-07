// <copyright file="RequiredConfigurationException.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Exceptions;

/// <summary>
/// Exception thrown when a required configuration value is missing.
/// Supports fail-fast pattern for configuration validation.
/// </summary>
/// <param name="settingName">
/// The name of the missing configuration setting.
/// </param>
/// <param name="environment">
/// Optional environment name for context.
/// </param>
public sealed class RequiredConfigurationException(
	string settingName,
	string? environment = null)
	: InvalidOperationException(
		BuildMessage(
			settingName,
			environment))
{
	/// <summary>
	/// Gets the name of the missing configuration setting.
	/// </summary>
	public string SettingName { get; } =
		settingName;

	/// <summary>
	/// Gets the environment where the configuration was expected.
	/// </summary>
	public string? Environment { get; } =
		environment;

	private static string BuildMessage(
		string settingName,
		string? environment)
	{
		string environmentPart =
			environment is not null
				? $" in {environment} environment"
				: string.Empty;

		return $"Required configuration '{settingName}' is missing{environmentPart}. " +
			"This value must be set in appsettings or environment variables.";
	}
}