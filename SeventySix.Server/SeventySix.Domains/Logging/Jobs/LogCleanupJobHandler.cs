// <copyright file="LogCleanupJobHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

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
public class LogCleanupJobHandler(
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

		if (!config.Enabled)
		{
			return;
		}

		DateTimeOffset now =
			timeProvider.GetUtcNow();

		DateTime cutoffDate =
			now.AddDays(-config.RetentionDays).UtcDateTime;

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

		TimeSpan interval =
			TimeSpan.FromHours(config.IntervalHours);

		await recurringJobService.RecordAndScheduleNextAsync<LogCleanupJob>(
			nameof(LogCleanupJob),
			now,
			interval,
			cancellationToken);
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
		DateTime cutoffDate)
	{
		string logDirectory =
			Path.Combine(
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