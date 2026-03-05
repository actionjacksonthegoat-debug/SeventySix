// <copyright file="ScheduledJobHealthCheckService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Data.Common;
using SeventySix.Shared.Constants;

namespace SeventySix.Api.Infrastructure;

/// <summary>
/// Background service that periodically checks scheduled job health
/// and logs warnings/errors for stale or unresponsive jobs.
/// </summary>
/// <param name="scopeFactory">
/// Factory for creating DI scopes (IScheduledJobService is scoped).
/// </param>
/// <param name="logger">
/// Logger for diagnostic messages.
/// </param>
public sealed class ScheduledJobHealthCheckService(
	IServiceScopeFactory scopeFactory,
	ILogger<ScheduledJobHealthCheckService> logger) : BackgroundService
{
	/// <summary>
	/// Interval between health checks.
	/// </summary>
	private static readonly TimeSpan CheckInterval =
		TimeSpan.FromMinutes(30);

	/// <summary>
	/// Initial delay before first health check to allow jobs to schedule.
	/// </summary>
	private static readonly TimeSpan InitialDelay =
		TimeSpan.FromMinutes(5);

	/// <summary>
	/// Critical jobs that warrant Error-level logging when degraded.
	/// </summary>
	private static readonly HashSet<string> CriticalJobs =
		new(StringComparer.OrdinalIgnoreCase)
		{
			"IpAnonymizationJob",
			"OrphanedRegistrationCleanupJob",
			"RefreshTokenCleanupJob",
		};

	/// <inheritdoc />
	protected override async Task ExecuteAsync(
		CancellationToken stoppingToken)
	{
		await Task.Delay(InitialDelay, stoppingToken);

		while (!stoppingToken.IsCancellationRequested)
		{
			await CheckJobHealthAsync(stoppingToken);
			await Task.Delay(CheckInterval, stoppingToken);
		}
	}

	/// <summary>
	/// Checks the health of all scheduled jobs and logs appropriate
	/// warnings or errors for stale or unknown jobs.
	/// </summary>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	internal async Task CheckJobHealthAsync(
		CancellationToken cancellationToken)
	{
		try
		{
			using IServiceScope scope =
				scopeFactory.CreateScope();

			IScheduledJobService jobService =
				scope.ServiceProvider
					.GetRequiredService<IScheduledJobService>();

			IReadOnlyList<RecurringJobStatusResponse> statuses =
				await jobService.GetAllJobStatusesAsync(
					cancellationToken);

			foreach (RecurringJobStatusResponse status in statuses)
			{
				switch (status.Status)
				{
					case HealthStatusConstants.Degraded:
						LogDegradedJob(status);
						break;
					case HealthStatusConstants.Unknown:
						LogUnknownJob(status);
						break;
				}
			}
		}
		catch (DbException exception)
		{
			logger.LogError(
				exception,
				"Failed to check scheduled job health status.");
		}
		catch (InvalidOperationException exception)
		{
			logger.LogError(
				exception,
				"Failed to check scheduled job health status.");
		}
	}

	/// <summary>
	/// Logs a degraded job at Error level if critical, Warning level otherwise.
	/// </summary>
	/// <param name="status">
	/// The job status response.
	/// </param>
	private void LogDegradedJob(RecurringJobStatusResponse status)
	{
		bool isCritical =
			CriticalJobs.Contains(status.JobName);

		if (isCritical)
		{
			logger.LogError(
				"CRITICAL scheduled job '{JobName}' is DEGRADED. "
				+ "Last executed: {LastExecutedAt:u}. "
				+ "Interval: {Interval}. "
				+ "This job is required for compliance/security.",
				status.JobName,
				status.LastExecutedAt,
				status.Interval);
		}
		else
		{
			logger.LogWarning(
				"Scheduled job '{JobName}' is DEGRADED. "
				+ "Last executed: {LastExecutedAt:u}. "
				+ "Interval: {Interval}.",
				status.JobName,
				status.LastExecutedAt,
				status.Interval);
		}
	}

	/// <summary>
	/// Logs an unknown job at Warning level.
	/// </summary>
	/// <param name="status">
	/// The job status response.
	/// </param>
	private void LogUnknownJob(RecurringJobStatusResponse status)
	{
		logger.LogWarning(
			"Scheduled job '{JobName}' has UNKNOWN status. "
			+ "No execution record found.",
			status.JobName);
	}
}