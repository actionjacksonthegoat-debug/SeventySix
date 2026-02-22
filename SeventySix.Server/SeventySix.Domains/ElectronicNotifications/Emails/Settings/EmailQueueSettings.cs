// <copyright file="EmailQueueSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ElectronicNotifications.Emails;

/// <summary>
/// Configuration settings for the email queue processor.
/// All values MUST be configured in appsettings.json.
/// </summary>
/// <remarks>
/// Bound from appsettings.json section "Email:Queue".
/// </remarks>
public sealed record EmailQueueSettings
{
	/// <summary>
	/// Configuration section name in appsettings.json.
	/// </summary>
	public const string SectionName = "Email:Queue";

	/// <summary>
	/// Gets whether queue processing is enabled.
	/// </summary>
	public bool Enabled { get; init; }

	/// <summary>
	/// Gets the interval in seconds between queue processing runs.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int ProcessingIntervalSeconds { get; init; }

	/// <summary>
	/// Gets the maximum number of emails to process per batch.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int BatchSize { get; init; }

	/// <summary>
	/// Gets the maximum number of send attempts before dead-lettering.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int MaxAttempts { get; init; }

	/// <summary>
	/// Gets the delay in minutes before retrying a failed email.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int RetryDelayMinutes { get; init; }

	/// <summary>
	/// Gets the hours after which failed emails are marked as dead letter.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int DeadLetterAfterHours { get; init; }

	/// <summary>
	/// Gets the fallback backoff in minutes when rate limit has no known reset time.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int RateLimitBackoffMinutes { get; init; }
}