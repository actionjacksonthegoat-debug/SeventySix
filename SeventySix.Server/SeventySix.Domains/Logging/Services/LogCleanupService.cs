// <copyright file="LogCleanupService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace SeventySix.Logging;

/// <summary>
/// Background service that periodically cleans up old logs from database and file system.
/// Follows TokenCleanupService pattern from Identity bounded context.
/// </summary>
/// <param name="scopeFactory">
/// Factory used to create DI scopes.
/// </param>
/// <param name="settings">
/// Options for <see cref="LogCleanupSettings"/> binding.
/// </param>
/// <param name="timeProvider">
/// Provides current time for scheduling and cutoff calculations.
/// </param>
/// <param name="logger">
/// Logger for diagnostic messages.
/// </param>
public class LogCleanupService(
	IServiceScopeFactory scopeFactory,
	IOptions<LogCleanupSettings> settings,
	TimeProvider timeProvider,
	ILogger<LogCleanupService> logger) : BackgroundService
{
	/// <inheritdoc/>
	protected override async Task ExecuteAsync(CancellationToken stoppingToken)
	{
		LogCleanupSettings config = settings.Value;

		TimeSpan initialDelay =
			TimeSpan.FromMinutes(
				config.InitialDelayMinutes);

		TimeSpan cleanupInterval =
			TimeSpan.FromHours(config.IntervalHours);

		// Initial delay to let app fully start
		if (initialDelay > TimeSpan.Zero)
		{
			await Task.Delay(initialDelay, stoppingToken);
		}

		while (!stoppingToken.IsCancellationRequested)
		{
			try
			{
				await CleanupDatabaseLogsAsync(stoppingToken);
				CleanupFileLogs();
			}
			catch (OperationCanceledException)
				when (stoppingToken.IsCancellationRequested)
			{
				// Graceful shutdown - don't log as error
				break;
			}
			catch (Exception ex)
			{
				logger.LogError(ex, "Error during log cleanup");
			}

			await Task.Delay(cleanupInterval, stoppingToken);
		}
	}

	/// <summary>
	/// Deletes database logs older than the retention cutoff configured in settings.
	/// </summary>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous cleanup operation.
	/// </returns>
	private async Task CleanupDatabaseLogsAsync(
		CancellationToken cancellationToken)
	{
		using IServiceScope scope = scopeFactory.CreateScope();

		ILogRepository repository =
			scope.ServiceProvider.GetRequiredService<ILogRepository>();

		DateTime cutoff =
			timeProvider
			.GetUtcNow()
			.AddDays(-settings.Value.RetentionDays)
			.UtcDateTime;

		int deletedCount =
			await repository.DeleteOlderThanAsync(
				cutoff,
				cancellationToken);

		if (deletedCount > 0)
		{
			logger.LogInformation(
				"Cleaned up {DeletedCount} database logs older than {CutoffDate:yyyy-MM-dd}",
				deletedCount,
				cutoff);
		}
	}

	/// <summary>
	/// Deletes log files from disk older than the configured retention period.
	/// </summary>
	/// <remarks>
	/// Uses <see cref="LogCleanupSettings.LogDirectory"/> and <see cref="LogCleanupSettings.LogFilePattern"/>.
	/// </remarks>
	private void CleanupFileLogs()
	{
		LogCleanupSettings config = settings.Value;

		string logDirectory =
			Path.Combine(
				AppContext.BaseDirectory,
				config.LogDirectory);

		if (!Directory.Exists(logDirectory))
		{
			return;
		}

		DateTime cutoff =
			timeProvider
			.GetUtcNow()
			.AddDays(-config.RetentionDays)
			.UtcDateTime;

		int deletedCount = 0;

		string[] logFiles =
			Directory.GetFiles(
				logDirectory,
				config.LogFilePattern);

		foreach (string filePath in logFiles)
		{
			try
			{
				FileInfo fileInfo =
					new(filePath);

				if (fileInfo.LastWriteTimeUtc < cutoff)
				{
					fileInfo.Delete();
					deletedCount++;
				}
			}
			catch (Exception ex)
			{
				logger.LogWarning(
					ex,
					"Failed to delete log file: {FilePath}",
					filePath);
			}
		}

		if (deletedCount > 0)
		{
			logger.LogInformation(
				"Cleaned up {DeletedCount} log files older than {CutoffDate:yyyy-MM-dd}",
				deletedCount,
				cutoff);
		}
	}
}