// <copyright file="IpAnonymizationSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity.Settings;

/// <summary>
/// Configuration settings for the IP address anonymization background job.
/// Implements GDPR Article 4 compliance for IP address retention.
/// </summary>
public record IpAnonymizationSettings
{
	/// <summary>
	/// The configuration section name for IP anonymization settings.
	/// </summary>
	public const string SectionName = "IpAnonymization";

	/// <summary>
	/// Gets or sets the interval in days between anonymization runs.
	/// Default is 7 days (weekly).
	/// </summary>
	public int IntervalDays { get; init; } = 7;

	/// <summary>
	/// Gets or sets the number of days to retain IP addresses before anonymization.
	/// Default is 90 days per GDPR data retention best practices.
	/// </summary>
	public int RetentionDays { get; init; } = 90;

	/// <summary>
	/// Gets the preferred UTC hour for anonymization (0-23).
	/// Default: 7 (2:30 AM EST when combined with minute).
	/// </summary>
	public int PreferredStartHourUtc { get; init; } = 7;

	/// <summary>
	/// Gets the preferred UTC minute for anonymization (0-59).
	/// Default: 30.
	/// </summary>
	public int PreferredStartMinuteUtc { get; init; } = 30;
}