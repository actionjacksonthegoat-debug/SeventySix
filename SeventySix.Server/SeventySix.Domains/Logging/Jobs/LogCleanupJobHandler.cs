// <copyright file="LogCleanupJobHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.Shared.BackgroundJobs;

namespace SeventySix.Logging.Jobs;

/// <summary>
/// Handles periodic cleanup of old logs from database and file system.
/// </summary>
/// <param name="logRepository">
/// Repository for database log operations.
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
public sealed class LogCleanupJobHandler(
	ILogRepository logRepository,
	IRecurringJobService recurringJobService,
	IOptions<LogCleanupSettings> settings,
	TimeProvider timeProvider,
	ILogger<LogCleanupJobHandler> logger)
{
	/// <summary>
	/// Handles the log cleanup job.
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
		LogCleanupJob job,
		CancellationToken cancellationToken)
	{
		LogCleanupSettings config =
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
				nameof(LogCleanupJob));
		}

		// ALWAYS reschedule — never break the chain
		DateTimeOffset now =
			timeProvider.GetUtcNow();

		TimeSpan interval =
			TimeSpan.FromHours(config.IntervalHours);

		await recurringJobService.RecordAndScheduleNextAsync<LogCleanupJob>(
			nameof(LogCleanupJob),
			now,
			interval,
			cancellationToken);
	}

	/// <summary>
	/// Executes the cleanup work in a try/catch to ensure rescheduling
	/// always occurs even when errors happen.
	/// </summary>
	/// <param name="config">
	/// The log cleanup settings.
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	private async Task ExecuteCleanupAsync(
		LogCleanupSettings config,
		CancellationToken cancellationToken)
	{
		try
		{
			DateTimeOffset now =
				timeProvider.GetUtcNow();

			DateTimeOffset cutoffDate =
				now.AddDays(-config.RetentionDays);

			// Database cleanup
			int deletedDatabaseLogs =
				await logRepository.DeleteOlderThanAsync(
					cutoffDate,
					cancellationToken);

			if (deletedDatabaseLogs > 0)
			{
				logger.LogInformation(
					"Database log cleanup completed: {DeletedCount} logs removed",
					deletedDatabaseLogs);
			}

			// File system cleanup
			int deletedLogFiles =
				CleanupLogFiles(
					config,
					cutoffDate);

			if (deletedLogFiles > 0)
			{
				logger.LogInformation(
					"File log cleanup completed: {DeletedCount} files removed",
					deletedLogFiles);
			}
		}
		catch (DbUpdateException exception)
		{
			logger.LogError(
				exception,
				"Database update error during {JobName}. Job will reschedule normally.",
				nameof(LogCleanupJob));
		}
		catch (DbException exception)
		{
			logger.LogError(
				exception,
				"Database error during {JobName}. Job will reschedule normally.",
				nameof(LogCleanupJob));
		}
		catch (InvalidOperationException exception)
		{
			logger.LogError(
				exception,
				"Operation error during {JobName}. Job will reschedule normally.",
				nameof(LogCleanupJob));
		}
		catch (IOException exception)
		{
			logger.LogError(
				exception,
				"File system error during {JobName}. Job will reschedule normally.",
				nameof(LogCleanupJob));
		}
	}

	/// <summary>
	/// Cleans up log files older than the cutoff date from the configured directory.
	/// </summary>
	/// <param name="config">
	/// The log cleanup settings containing directory and file pattern.
	/// </param>
	/// <param name="cutoffDate">
	/// The date before which log files should be deleted.
	/// </param>
	/// <returns>
	/// The number of log files deleted.
	/// </returns>
	private static int CleanupLogFiles(
		LogCleanupSettings config,
		DateTimeOffset cutoffDate)
	{
		string logDirectory =
			Path.Join(
				AppContext.BaseDirectory,
				config.LogDirectory);

		if (!Directory.Exists(logDirectory))
		{
			return 0;
		}

		int deletedCount = 0;

		string[] logFiles =
			Directory.GetFiles(
				logDirectory,
				config.LogFilePattern);

		foreach (string filePath in logFiles)
		{
			FileInfo fileInfo =
				new(filePath);

			if (fileInfo.LastWriteTimeUtc < cutoffDate)
			{
				try
				{
					fileInfo.Delete();
					deletedCount++;
				}
				catch (IOException)
				{
					// File in use - skip
				}
			}
		}

		return deletedCount;
	}
}