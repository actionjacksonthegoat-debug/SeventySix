// <copyright file="IpAnonymizationSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity.Settings;

/// <summary>
/// Configuration settings for the IP address anonymization background job.
/// Implements GDPR Article 4 compliance for IP address retention.
/// All values MUST be configured in appsettings.json.
/// </summary>
public record IpAnonymizationSettings
{
	/// <summary>
	/// The configuration section name for IP anonymization settings.
	/// </summary>
	public const string SectionName = "IpAnonymization";

	/// <summary>
	/// Gets or sets the interval in days between anonymization runs.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int IntervalDays { get; init; }

	/// <summary>
	/// Gets or sets the number of days to retain IP addresses before anonymization.
	/// GDPR data retention best practices suggest 90 days.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int RetentionDays { get; init; }

	/// <summary>
	/// Gets the preferred UTC hour for anonymization (0-23).
	/// Must be configured in appsettings.json.
	/// </summary>
	public int PreferredStartHourUtc { get; init; }

	/// <summary>
	/// Gets the preferred UTC minute for anonymization (0-59).
	/// Must be configured in appsettings.json.
	/// </summary>
	public int PreferredStartMinuteUtc { get; init; }
}