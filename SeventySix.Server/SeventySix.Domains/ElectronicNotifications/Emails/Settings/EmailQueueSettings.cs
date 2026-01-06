// <copyright file="EmailQueueSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ElectronicNotifications.Emails;

/// <summary>
/// Configuration settings for the email queue processor.
/// </summary>
/// <remarks>
/// Bound from appsettings.json section "Email:Queue".
/// </remarks>
public record EmailQueueSettings
{
	/// <summary>
	/// Configuration section name in appsettings.json.
	/// </summary>
	public const string SectionName = "Email:Queue";

	/// <summary>
	/// Gets whether queue processing is enabled.
	/// </summary>
	public bool Enabled { get; init; } = true;

	/// <summary>
	/// Gets the interval in seconds between queue processing runs.
	/// </summary>
	public int ProcessingIntervalSeconds { get; init; } = 30;

	/// <summary>
	/// Gets the maximum number of emails to process per batch.
	/// </summary>
	public int BatchSize { get; init; } = 50;

	/// <summary>
	/// Gets the maximum number of send attempts before dead-lettering.
	/// </summary>
	public int MaxAttempts { get; init; } = 3;

	/// <summary>
	/// Gets the delay in minutes before retrying a failed email.
	/// </summary>
	public int RetryDelayMinutes { get; init; } = 5;

	/// <summary>
	/// Gets the hours after which failed emails are marked as dead letter.
	/// </summary>
	public int DeadLetterAfterHours { get; init; } = 24;
}