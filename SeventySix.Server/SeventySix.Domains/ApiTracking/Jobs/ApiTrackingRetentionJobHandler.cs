// <copyright file="ApiTrackingRetentionJobHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.Shared.BackgroundJobs;

namespace SeventySix.ApiTracking.Jobs;

/// <summary>
/// Handles periodic cleanup of old API tracking records.
/// </summary>
/// <param name="repository">
/// Repository for API tracking data access.
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
public sealed class ApiTrackingRetentionJobHandler(
	IThirdPartyApiRequestRepository repository,
	IRecurringJobService recurringJobService,
	IOptions<ApiTrackingRetentionSettings> settings,
	TimeProvider timeProvider,
	ILogger<ApiTrackingRetentionJobHandler> logger)
{
	/// <summary>
	/// Handles the API tracking retention job.
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
		ApiTrackingRetentionJob job,
		CancellationToken cancellationToken)
	{
		ApiTrackingRetentionSettings config =
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
				nameof(ApiTrackingRetentionJob));
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

		await recurringJobService.RecordAndScheduleNextAnchoredAsync<ApiTrackingRetentionJob>(
			nameof(ApiTrackingRetentionJob),
			now,
			preferredTimeUtc,
			interval,
			cancellationToken);
	}

	/// <summary>
	/// Executes the retention cleanup for API tracking records.
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
		ApiTrackingRetentionSettings config,
		CancellationToken cancellationToken)
	{
		try
		{
			DateTimeOffset now =
				timeProvider.GetUtcNow();

			DateOnly cutoffDate =
				DateOnly.FromDateTime(now.AddDays(-config.RetentionDays).DateTime);

			int deletedCount =
				await repository.DeleteOlderThanAsync(
					cutoffDate,
					cancellationToken);

			if (deletedCount > 0)
			{
				logger.LogInformation(
					"API tracking retention completed: {DeletedCount} records removed",
					deletedCount);
			}
		}
		catch (DbUpdateException exception)
		{
			logger.LogError(
				exception,
				"Database update error during {JobName}. Job will reschedule normally.",
				nameof(ApiTrackingRetentionJob));
		}
		catch (DbException exception)
		{
			logger.LogError(
				exception,
				"Database error during {JobName}. Job will reschedule normally.",
				nameof(ApiTrackingRetentionJob));
		}
	}
}
