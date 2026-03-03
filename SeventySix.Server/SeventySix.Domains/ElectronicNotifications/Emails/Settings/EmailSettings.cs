// <copyright file="EmailSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ElectronicNotifications.Emails;

/// <summary>
/// Email service configuration bound from appsettings.json.
/// </summary>
/// <remarks>
/// Configuration should be stored in appsettings.json under the "Email" section.
/// Sensitive values (ApiKey) should use user secrets or environment variables.
/// When Enabled=true, all required fields (ApiKey, ApiUrl, FromAddress, ClientBaseUrl)
/// must be set; validator will catch missing values.
/// </remarks>
public sealed record EmailSettings
{
	/// <summary>
	/// Configuration section name for binding.
	/// </summary>
	public const string SectionName = "Email";

	/// <summary>
	/// Gets the Brevo HTTP API key for transactional emails.
	/// </summary>
	/// <remarks>
	/// Must be set when Enabled=true; validator will catch missing values.
	/// </remarks>
	public string ApiKey { get; init; } =
		string.Empty;

	/// <summary>
	/// Gets the Brevo API base URL. Defaults to production Brevo.
	/// Override to mock Brevo API URL in E2E/LoadTest environments.
	/// </summary>
	public string ApiUrl { get; init; } =
		"https://api.brevo.com";

	/// <summary>
	/// Gets the sender email address.
	/// </summary>
	/// <remarks>
	/// Must be set when Enabled=true; validator will catch missing values.
	/// </remarks>
	public string FromAddress { get; init; } =
		string.Empty;

	/// <summary>
	/// Gets the sender display name.
	/// </summary>
	public string FromName { get; init; } =
		"SeventySix";

	/// <summary>
	/// Gets the base URL for links in emails (client app URL).
	/// </summary>
	/// <remarks>
	/// Must be set when Enabled=true; validator will catch missing values.
	/// </remarks>
	public string ClientBaseUrl { get; init; } =
		string.Empty;

	/// <summary>
	/// Gets whether email sending is enabled.
	/// When false, emails are logged but not actually sent (development mode).
	/// </summary>
	public bool Enabled { get; init; }
}