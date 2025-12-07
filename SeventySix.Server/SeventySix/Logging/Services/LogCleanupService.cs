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
public class LogCleanupService(
	IServiceScopeFactory scopeFactory,
	IOptions<LogCleanupSettings> settings,
	ILogger<LogCleanupService> logger) : BackgroundService
{
	/// <inheritdoc/>
	protected override async Task ExecuteAsync(CancellationToken stoppingToken)
	{
		LogCleanupSettings config =
			settings.Value;

		TimeSpan initialDelay =
			TimeSpan.FromMinutes(config.InitialDelayMinutes);

		TimeSpan cleanupInterval =
			TimeSpan.FromHours(config.IntervalHours);

		// Initial delay to let app fully start
		if (initialDelay > TimeSpan.Zero)
		{
			await Task.Delay(
				initialDelay,
				stoppingToken);
		}

		while (!stoppingToken.IsCancellationRequested)
		{
			try
			{
				await CleanupDatabaseLogsAsync(stoppingToken);
				CleanupFileLogs();
			}
			catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
			{
				// Graceful shutdown - don't log as error
				break;
			}
			catch (Exception ex)
			{
				logger.LogError(
					ex,
					"Error during log cleanup");
			}

			await Task.Delay(
				cleanupInterval,
				stoppingToken);
		}
	}

	private async Task CleanupDatabaseLogsAsync(CancellationToken cancellationToken)
	{
		using IServiceScope scope =
			scopeFactory.CreateScope();

		ILogRepository repository =
			scope.ServiceProvider.GetRequiredService<ILogRepository>();

		DateTime cutoff =
			DateTime.UtcNow.AddDays(-settings.Value.RetentionDays);

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

	private void CleanupFileLogs()
	{
		LogCleanupSettings config =
			settings.Value;

		string logDirectory =
			Path.Combine(
				AppContext.BaseDirectory,
				config.LogDirectory);

		if (!Directory.Exists(logDirectory))
		{
			return;
		}

		DateTime cutoff =
			DateTime.UtcNow.AddDays(-config.RetentionDays);

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