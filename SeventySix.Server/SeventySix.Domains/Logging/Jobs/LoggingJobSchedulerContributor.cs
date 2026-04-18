// <copyright file="LoggingJobSchedulerContributor.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Diagnostics.CodeAnalysis;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SeventySix.Shared.BackgroundJobs;
using SeventySix.Shared.Exceptions;

namespace SeventySix.Logging.Jobs;

/// <summary>
/// Schedules Logging domain recurring jobs
/// (<see cref="LogCleanupJob"/> and <see cref="DatabaseMaintenanceJob"/>).
/// </summary>
/// <param name="configuration">
/// Application configuration for reading job settings.
/// </param>
/// <param name="logger">
/// Logger for diagnostic messages.
/// </param>
[ExcludeFromCodeCoverage]
public sealed class LoggingJobSchedulerContributor(
	IConfiguration configuration,
	ILogger<LoggingJobSchedulerContributor> logger) : IJobSchedulerContributor
{
	/// <inheritdoc />
	public async Task ScheduleJobsAsync(
		IRecurringJobService recurringJobService,
		CancellationToken cancellationToken)
	{
		await ScheduleLogCleanupJobAsync(
			recurringJobService,
			cancellationToken);

		await ScheduleDatabaseMaintenanceJobAsync(
			recurringJobService,
			cancellationToken);
	}

	/// <summary>
	/// Schedules the log cleanup job if enabled.
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
	private async Task ScheduleLogCleanupJobAsync(
		IRecurringJobService recurringJobService,
		CancellationToken cancellationToken)
	{
		LogCleanupSettings settings =
			configuration
				.GetSection(LogCleanupSettings.SectionName)
				.Get<LogCleanupSettings>()
			?? throw new RequiredConfigurationException(LogCleanupSettings.SectionName);

		if (!settings.Enabled)
		{
			logger.LogInformation(
				"Skipping {JobName} - log cleanup disabled",
				nameof(LogCleanupJob));
			return;
		}

		TimeOnly preferredTimeUtc =
			new(
				settings.PreferredStartHourUtc,
				settings.PreferredStartMinuteUtc);

		TimeSpan interval =
			TimeSpan.FromHours(settings.IntervalHours);

		await recurringJobService.EnsureScheduledAtPreferredTimeAsync<LogCleanupJob>(
			nameof(LogCleanupJob),
			preferredTimeUtc,
			interval,
			cancellationToken);

		logger.LogInformation(
			"Scheduled {JobName} at {PreferredTime:HH:mm} UTC with interval {Interval}",
			nameof(LogCleanupJob),
			preferredTimeUtc,
			interval);
	}

	/// <summary>
	/// Schedules the database maintenance job for PostgreSQL VACUUM ANALYZE.
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
	private async Task ScheduleDatabaseMaintenanceJobAsync(
		IRecurringJobService recurringJobService,
		CancellationToken cancellationToken)
	{
		DatabaseMaintenanceSettings settings =
			configuration
				.GetSection(DatabaseMaintenanceSettings.SectionName)
				.Get<DatabaseMaintenanceSettings>()
			?? throw new RequiredConfigurationException(DatabaseMaintenanceSettings.SectionName);

		if (!settings.Enabled)
		{
			logger.LogInformation(
				"Skipping {JobName} - database maintenance disabled",
				nameof(DatabaseMaintenanceJob));
			return;
		}

		TimeOnly preferredTimeUtc =
			new(
				settings.PreferredStartHourUtc,
				settings.PreferredStartMinuteUtc);

		TimeSpan interval =
			TimeSpan.FromHours(settings.IntervalHours);

		await recurringJobService.EnsureScheduledAtPreferredTimeAsync<DatabaseMaintenanceJob>(
			nameof(DatabaseMaintenanceJob),
			preferredTimeUtc,
			interval,
			cancellationToken);

		logger.LogInformation(
			"Scheduled {JobName} at {PreferredTime:HH:mm} UTC with interval {Interval}",
			nameof(DatabaseMaintenanceJob),
			preferredTimeUtc,
			interval);
	}
}