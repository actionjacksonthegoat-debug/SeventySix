// <copyright file="DatabaseMaintenanceJobHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.Shared.BackgroundJobs;

namespace SeventySix.Logging.Jobs;

/// <summary>
/// Handles periodic PostgreSQL maintenance for the shared database.
/// Executes VACUUM ANALYZE to reclaim storage and update query statistics.
/// </summary>
/// <remarks>
/// <para>
/// All bounded contexts share a single PostgreSQL database with separate schemas.
/// A database-level VACUUM ANALYZE affects all schemas, so only one job is needed.
/// </para>
/// <para>
/// VACUUM ANALYZE is safe to run during operation - it does not lock tables exclusively
/// and completes relatively quickly for normal table sizes.
/// </para>
/// </remarks>
/// <param name="databaseMaintenanceService">
/// Service for executing database maintenance commands.
/// </param>
/// <param name="recurringJobService">
/// Service for recording execution and scheduling next run.
/// </param>
/// <param name="settings">
/// Configuration for maintenance behavior.
/// </param>
/// <param name="timeProvider">
/// Provides current time for scheduling.
/// </param>
/// <param name="logger">
/// Logger for diagnostic messages.
/// </param>
public class DatabaseMaintenanceJobHandler(
	IDatabaseMaintenanceService databaseMaintenanceService,
	IRecurringJobService recurringJobService,
	IOptions<DatabaseMaintenanceSettings> settings,
	TimeProvider timeProvider,
	ILogger<DatabaseMaintenanceJobHandler> logger)
{
	/// <summary>
	/// Handles the database maintenance job.
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
		DatabaseMaintenanceJob job,
		CancellationToken cancellationToken)
	{
		DatabaseMaintenanceSettings config = settings.Value;

		if (!config.Enabled)
		{
			return;
		}

		DateTimeOffset now = timeProvider.GetUtcNow();

		await databaseMaintenanceService.ExecuteVacuumAnalyzeAsync(cancellationToken);

		logger.LogInformation(
			"Database maintenance completed: VACUUM ANALYZE executed on all schemas");

		TimeSpan interval =
			TimeSpan.FromHours(config.IntervalHours);

		await recurringJobService.RecordAndScheduleNextAsync<DatabaseMaintenanceJob>(
			nameof(DatabaseMaintenanceJob),
			now,
			interval,
			cancellationToken);
	}
}