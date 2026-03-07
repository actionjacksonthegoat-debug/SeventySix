// <copyright file="OrphanedRegistrationCleanupJobHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.Identity.Settings;
using SeventySix.Shared.BackgroundJobs;

namespace SeventySix.Identity.Jobs;

/// <summary>
/// Handles periodic cleanup of orphaned registration users.
/// Removes users who started registration but never completed email confirmation.
/// </summary>
/// <param name="dbContext">
/// The Identity database context.
/// </param>
/// <param name="recurringJobService">
/// Service for recording execution and scheduling next run.
/// </param>
/// <param name="settings">
/// Configuration for cleanup behavior.
/// </param>
/// <param name="timeProvider">
/// Provides current time for cutoff calculations.
/// </param>
/// <param name="logger">
/// Logger for diagnostic messages.
/// </param>
public sealed class OrphanedRegistrationCleanupJobHandler(
	IdentityDbContext dbContext,
	IRecurringJobService recurringJobService,
	IOptions<OrphanedRegistrationCleanupSettings> settings,
	TimeProvider timeProvider,
	ILogger<OrphanedRegistrationCleanupJobHandler> logger)
{
	/// <summary>
	/// Handles the orphaned registration cleanup job.
	/// Deletes users where IsActive is false, EmailConfirmed is false,
	/// and CreateDate is older than the retention threshold.
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
		OrphanedRegistrationCleanupJob job,
		CancellationToken cancellationToken)
	{
		OrphanedRegistrationCleanupSettings config =
			settings.Value;

		try
		{
			if (config.Enabled)
			{
				await ExecuteCleanupAsync(config, cancellationToken);
			}
		}
		catch (Exception exception) when (exception is not OperationCanceledException)
		{
			logger.LogError(
				exception,
				"Job {JobName} failed with unexpected exception",
				nameof(OrphanedRegistrationCleanupJob));
		}

		// ALWAYS reschedule — never break the chain
		DateTimeOffset now =
			timeProvider.GetUtcNow();

		TimeSpan interval =
			TimeSpan.FromHours(config.IntervalHours);

		await recurringJobService.RecordAndScheduleNextAsync<OrphanedRegistrationCleanupJob>(
			nameof(OrphanedRegistrationCleanupJob),
			now,
			interval,
			cancellationToken);
	}

	/// <summary>
	/// Executes the cleanup work in a try/catch to ensure rescheduling
	/// always occurs even when errors happen.
	/// </summary>
	/// <param name="config">
	/// The orphaned registration cleanup settings.
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	private async Task ExecuteCleanupAsync(
		OrphanedRegistrationCleanupSettings config,
		CancellationToken cancellationToken)
	{
		try
		{
			DateTimeOffset now =
				timeProvider.GetUtcNow();

			DateTimeOffset cutoffDate =
				now.AddHours(-config.RetentionHours);

			int deletedCount =
				await dbContext.Users
					.Where(user =>
						!user.IsActive
						&& !user.EmailConfirmed
						&& user.CreateDate < cutoffDate)
					.ExecuteDeleteAsync(cancellationToken);

			if (deletedCount > 0)
			{
				logger.LogInformation(
					"Orphaned registration cleanup completed: {DeletedCount} orphaned users removed",
					deletedCount);
			}
		}
		catch (DbUpdateException exception)
		{
			logger.LogError(
				exception,
				"Database update error during {JobName}. Job will reschedule normally.",
				nameof(OrphanedRegistrationCleanupJob));
		}
		catch (DbException exception)
		{
			logger.LogError(
				exception,
				"Database error during {JobName}. Job will reschedule normally.",
				nameof(OrphanedRegistrationCleanupJob));
		}
		catch (InvalidOperationException exception)
		{
			logger.LogError(
				exception,
				"Operation error during {JobName}. Job will reschedule normally.",
				nameof(OrphanedRegistrationCleanupJob));
		}
	}
}