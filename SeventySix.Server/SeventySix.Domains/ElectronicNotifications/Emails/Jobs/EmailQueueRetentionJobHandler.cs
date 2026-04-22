// <copyright file="EmailQueueRetentionJobHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.Shared.BackgroundJobs;

namespace SeventySix.ElectronicNotifications.Emails.Jobs;

/// <summary>
/// Handles periodic cleanup of completed email queue entries.
/// Only deletes <c>Sent</c> and <c>Failed</c> entries; never touches <c>Pending</c> or <c>Processing</c>.
/// </summary>
/// <param name="dbContext">
/// Database context for email queue access.
/// </param>
/// <param name="recurringJobService">
/// Service for recording execution and scheduling next run.
/// </param>
/// <param name="settings">
/// Configuration for retention behavior.
/// </param>
/// <param name="timeProvider">
/// Provides current time for cutoff calculations.
/// </param>
/// <param name="logger">
/// Logger for diagnostic messages.
/// </param>
public sealed class EmailQueueRetentionJobHandler(
	ElectronicNotificationsDbContext dbContext,
	IRecurringJobService recurringJobService,
	IOptions<EmailQueueRetentionSettings> settings,
	TimeProvider timeProvider,
	ILogger<EmailQueueRetentionJobHandler> logger)
{
	/// <summary>
	/// Maximum number of rows deleted per batch to avoid long-running locks.
	/// </summary>
	private const int BatchSize = 10_000;

	/// <summary>
	/// Handles the email queue retention job.
	/// </summary>
	/// <param name="job">
	/// The job message (marker type).
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	public async Task HandleAsync(
		EmailQueueRetentionJob job,
		CancellationToken cancellationToken)
	{
		EmailQueueRetentionSettings config =
			settings.Value;

		try
		{
			if (config.Enabled)
			{
				await ExecuteRetentionAsync(config, cancellationToken);
			}
		}
		catch (Exception exception) when (exception is not OperationCanceledException)
		{
			logger.LogError(
				exception,
				"Job {JobName} failed with unexpected exception",
				nameof(EmailQueueRetentionJob));
		}

		// ALWAYS reschedule — never break the chain
		DateTimeOffset now =
			timeProvider.GetUtcNow();

		TimeSpan interval =
			TimeSpan.FromHours(config.IntervalHours);

		TimeOnly preferredTimeUtc =
			new(
				config.PreferredStartHourUtc,
				config.PreferredStartMinuteUtc);

		await recurringJobService.RecordAndScheduleNextAnchoredAsync<EmailQueueRetentionJob>(
			nameof(EmailQueueRetentionJob),
			now,
			preferredTimeUtc,
			interval,
			cancellationToken);
	}

	/// <summary>
	/// Executes chunked deletion of completed email queue entries.
	/// </summary>
	/// <param name="config">
	/// The retention settings.
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	private async Task ExecuteRetentionAsync(
		EmailQueueRetentionSettings config,
		CancellationToken cancellationToken)
	{
		try
		{
			DateTimeOffset cutoff =
				timeProvider.GetUtcNow().AddDays(-config.RetentionDays);

			int totalDeleted = 0;
			int batchDeleted;

			do
			{
				batchDeleted =
					await dbContext.EmailQueue
						.Where(entry =>
							(entry.Status == EmailQueueStatus.Sent
								|| entry.Status == EmailQueueStatus.Failed)
							&& entry.CreateDate < cutoff)
						.OrderBy(entry => entry.CreateDate)
						.Take(BatchSize)
						.ExecuteDeleteAsync(cancellationToken);

				totalDeleted += batchDeleted;
			}
			while (batchDeleted == BatchSize);

			if (totalDeleted > 0)
			{
				logger.LogInformation(
					"Email queue retention completed: entries removed from email queue");
			}
		}
		catch (DbUpdateException exception)
		{
			logger.LogError(
				exception,
				"Database update error during {JobName}. Job will reschedule normally.",
				nameof(EmailQueueRetentionJob));
		}
		catch (DbException exception)
		{
			logger.LogError(
				exception,
				"Database error during {JobName}. Job will reschedule normally.",
				nameof(EmailQueueRetentionJob));
		}
	}
}