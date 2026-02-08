// <copyright file="EmailSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ElectronicNotifications.Emails;

/// <summary>
/// Email service configuration bound from appsettings.json.
/// </summary>
/// <remarks>
/// Configuration should be stored in appsettings.json under the "Email" section.
/// Sensitive values (SmtpPassword) should use user secrets or environment variables.
/// When Enabled=true, all required fields (SmtpHost, FromAddress, ClientBaseUrl)
/// must be set; validator will catch missing values.
/// </remarks>
public record EmailSettings
{
	/// <summary>
	/// Configuration section name for binding.
	/// </summary>
	public const string SectionName = "Email";

	/// <summary>
	/// Gets the SMTP server hostname.
	/// </summary>
	/// <remarks>
	/// Must be set when Enabled=true; validator will catch missing values.
	/// </remarks>
	public string SmtpHost { get; init; } =
		string.Empty;

	/// <summary>
	/// Gets the SMTP server port. Default: 587 (TLS submission port).
	/// </summary>
	public int SmtpPort { get; init; } =
		587;

	/// <summary>
	/// Gets the SMTP username for authentication.
	/// </summary>
	public string SmtpUsername { get; init; } =
		string.Empty;

	/// <summary>
	/// Gets the SMTP password for authentication.
	/// </summary>
	public string SmtpPassword { get; init; } =
		string.Empty;

	/// <summary>
	/// Gets whether to use SSL/TLS for the connection.
	/// </summary>
	public bool UseSsl { get; init; } =
		true;

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
	public bool Enabled { get; init; } =
		false;
}