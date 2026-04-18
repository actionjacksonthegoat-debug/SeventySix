// <copyright file="EmailQueueJobSchedulerContributor.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Diagnostics.CodeAnalysis;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SeventySix.Shared.BackgroundJobs;
using SeventySix.Shared.Exceptions;

namespace SeventySix.ElectronicNotifications.Emails.Jobs;

/// <summary>
/// Schedules ElectronicNotifications recurring jobs
/// (<see cref="EmailQueueProcessJob"/> and <see cref="EmailQueueRetentionJob"/>).
/// </summary>
/// <param name="configuration">
/// Application configuration for reading job settings.
/// </param>
/// <param name="logger">
/// Logger for diagnostic messages.
/// </param>
[ExcludeFromCodeCoverage]
public sealed class EmailQueueJobSchedulerContributor(
	IConfiguration configuration,
	ILogger<EmailQueueJobSchedulerContributor> logger) : IJobSchedulerContributor
{
	/// <inheritdoc />
	public async Task ScheduleJobsAsync(
		IRecurringJobService recurringJobService,
		CancellationToken cancellationToken)
	{
		await ScheduleProcessJobAsync(recurringJobService, cancellationToken);
		await ScheduleRetentionJobAsync(recurringJobService, cancellationToken);
	}

	/// <summary>
	/// Schedules the email queue processing job if enabled.
	/// </summary>
	/// <param name="recurringJobService">
	/// The recurring job service for scheduling.
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	private async Task ScheduleProcessJobAsync(
		IRecurringJobService recurringJobService,
		CancellationToken cancellationToken)
	{
		EmailSettings emailSettings =
			configuration.GetSection(EmailSettings.SectionName).Get<EmailSettings>()
			?? throw new RequiredConfigurationException(EmailSettings.SectionName);

		EmailQueueSettings queueSettings =
			configuration
				.GetSection(EmailQueueSettings.SectionName)
				.Get<EmailQueueSettings>()
			?? throw new RequiredConfigurationException(EmailQueueSettings.SectionName);

		if (!emailSettings.Enabled || !queueSettings.Enabled)
		{
			logger.LogInformation(
				"Skipping {JobName} - email or queue processing disabled",
				nameof(EmailQueueProcessJob));
			return;
		}

		TimeSpan interval =
			TimeSpan.FromSeconds(
				queueSettings.ProcessingIntervalSeconds);

		await recurringJobService.EnsureScheduledAsync<EmailQueueProcessJob>(
			nameof(EmailQueueProcessJob),
			interval,
			cancellationToken);

		logger.LogInformation(
			"Scheduled {JobName} with interval {Interval}",
			nameof(EmailQueueProcessJob),
			interval);
	}

	/// <summary>
	/// Schedules the email queue retention job if enabled.
	/// </summary>
	/// <param name="recurringJobService">
	/// The recurring job service for scheduling.
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	private async Task ScheduleRetentionJobAsync(
		IRecurringJobService recurringJobService,
		CancellationToken cancellationToken)
	{
		EmailQueueRetentionSettings settings =
			configuration
				.GetSection(EmailQueueRetentionSettings.SectionName)
				.Get<EmailQueueRetentionSettings>()
			?? throw new RequiredConfigurationException(EmailQueueRetentionSettings.SectionName);

		if (!settings.Enabled)
		{
			logger.LogInformation(
				"Skipping {JobName} - email queue retention disabled",
				nameof(EmailQueueRetentionJob));
			return;
		}

		TimeOnly preferredTimeUtc =
			new(
				settings.PreferredStartHourUtc,
				settings.PreferredStartMinuteUtc);

		TimeSpan interval =
			TimeSpan.FromHours(settings.IntervalHours);

		await recurringJobService.EnsureScheduledAtPreferredTimeAsync<EmailQueueRetentionJob>(
			nameof(EmailQueueRetentionJob),
			preferredTimeUtc,
			interval,
			cancellationToken);

		logger.LogInformation(
			"Scheduled {JobName} at {PreferredTime:HH:mm} UTC with interval {Interval}",
			nameof(EmailQueueRetentionJob),
			preferredTimeUtc,
			interval);
	}
}