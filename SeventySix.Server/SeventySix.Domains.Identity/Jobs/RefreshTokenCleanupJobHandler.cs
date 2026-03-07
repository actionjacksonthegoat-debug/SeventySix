// <copyright file="RefreshTokenCleanupJobHandler.cs" company="SeventySix">
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
/// Handles periodic cleanup of expired refresh tokens.
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
public sealed class RefreshTokenCleanupJobHandler(
	IdentityDbContext dbContext,
	IRecurringJobService recurringJobService,
	IOptions<RefreshTokenCleanupSettings> settings,
	TimeProvider timeProvider,
	ILogger<RefreshTokenCleanupJobHandler> logger)
{
	/// <summary>
	/// Handles the refresh token cleanup job.
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
		RefreshTokenCleanupJob job,
		CancellationToken cancellationToken)
	{
		RefreshTokenCleanupSettings config =
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
				nameof(RefreshTokenCleanupJob));
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

		await recurringJobService.RecordAndScheduleNextAnchoredAsync<RefreshTokenCleanupJob>(
			nameof(RefreshTokenCleanupJob),
			now,
			preferredTimeUtc,
			interval,
			cancellationToken);
	}

	/// <summary>
	/// Executes the cleanup work in a try/catch to ensure rescheduling
	/// always occurs even when errors happen.
	/// </summary>
	/// <param name="config">
	/// The refresh token cleanup settings.
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	private async Task ExecuteCleanupAsync(
		RefreshTokenCleanupSettings config,
		CancellationToken cancellationToken)
	{
		try
		{
			DateTimeOffset now =
				timeProvider.GetUtcNow();

			DateTimeOffset cutoffDate =
				now.AddDays(-config.RetentionDays);

			int deletedCount =
				await dbContext.RefreshTokens
					.Where(
						token => token.ExpiresAt < cutoffDate)
					.ExecuteDeleteAsync(cancellationToken);

			if (deletedCount > 0)
			{
				logger.LogInformation(
					"Refresh token cleanup completed: {DeletedCount} expired tokens removed",
					deletedCount);
			}
		}
		catch (DbUpdateException exception)
		{
			logger.LogError(
				exception,
				"Database update error during {JobName}. Job will reschedule normally.",
				nameof(RefreshTokenCleanupJob));
		}
		catch (DbException exception)
		{
			logger.LogError(
				exception,
				"Database error during {JobName}. Job will reschedule normally.",
				nameof(RefreshTokenCleanupJob));
		}
		catch (InvalidOperationException exception)
		{
			logger.LogError(
				exception,
				"Operation error during {JobName}. Job will reschedule normally.",
				nameof(RefreshTokenCleanupJob));
		}
	}
}