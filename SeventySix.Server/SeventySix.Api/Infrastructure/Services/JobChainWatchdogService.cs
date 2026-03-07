// <copyright file="JobChainWatchdogService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Data.Common;
using Microsoft.Extensions.Options;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.ElectronicNotifications.Emails.Jobs;
using SeventySix.Identity.Jobs;
using SeventySix.Identity.Settings;
using SeventySix.Logging;
using SeventySix.Logging.Jobs;
using SeventySix.Shared.BackgroundJobs;

namespace SeventySix.Api.Infrastructure;

/// <summary>
/// Periodic watchdog that detects stale job chains and re-bootstraps
/// them by calling <see cref="IRecurringJobService.EnsureScheduledAsync{TJob}"/>.
/// Complements <see cref="ScheduledJobHealthCheckService"/> which only monitors.
/// </summary>
/// <param name="scopeFactory">
/// Factory for creating DI scopes.
/// </param>
/// <param name="emailQueueSettings">
/// Email queue processing interval settings.
/// </param>
/// <param name="logCleanupSettings">
/// Log cleanup interval settings.
/// </param>
/// <param name="refreshTokenCleanupSettings">
/// Refresh token cleanup interval settings.
/// </param>
/// <param name="orphanedRegistrationCleanupSettings">
/// Orphaned registration cleanup interval settings.
/// </param>
/// <param name="databaseMaintenanceSettings">
/// Database maintenance interval settings.
/// </param>
/// <param name="timeProvider">
/// Abstraction for time-related operations.
/// </param>
/// <param name="logger">
/// Logger for diagnostic messages.
/// </param>
public sealed class JobChainWatchdogService(
	IServiceScopeFactory scopeFactory,
	IOptions<EmailQueueSettings> emailQueueSettings,
	IOptions<LogCleanupSettings> logCleanupSettings,
	IOptions<RefreshTokenCleanupSettings> refreshTokenCleanupSettings,
	IOptions<OrphanedRegistrationCleanupSettings> orphanedRegistrationCleanupSettings,
	IOptions<DatabaseMaintenanceSettings> databaseMaintenanceSettings,
	TimeProvider timeProvider,
	ILogger<JobChainWatchdogService> logger) : BackgroundService
{
	/// <summary>
	/// Interval between watchdog checks.
	/// </summary>
	internal static readonly TimeSpan CheckInterval =
		TimeSpan.FromMinutes(5);

	/// <summary>
	/// Initial delay before the first watchdog check.
	/// Allows the startup scheduler to complete first.
	/// </summary>
	internal static readonly TimeSpan InitialDelay =
		TimeSpan.FromMinutes(10);

	/// <summary>
	/// Minimum staleness threshold to avoid false positives on short-interval jobs.
	/// </summary>
	private static readonly TimeSpan MinimumStalenessThreshold =
		TimeSpan.FromMinutes(10);

	/// <summary>
	/// Multiplier applied to interval when computing staleness: 3x the interval.
	/// </summary>
	private const int StalenessMultiplier = 3;

	/// <inheritdoc />
	protected override async Task ExecuteAsync(
		CancellationToken stoppingToken)
	{
		await Task.Delay(InitialDelay, stoppingToken);

		while (!stoppingToken.IsCancellationRequested)
		{
			await CheckAndRebootstrapAsync(stoppingToken);
			await Task.Delay(CheckInterval, stoppingToken);
		}
	}

	/// <summary>
	/// Checks all known jobs for staleness and re-bootstraps broken chains.
	/// </summary>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	internal async Task CheckAndRebootstrapAsync(
		CancellationToken cancellationToken)
	{
		try
		{
			using IServiceScope scope =
				scopeFactory.CreateScope();

			IRecurringJobRepository repository =
				scope.ServiceProvider
					.GetRequiredService<IRecurringJobRepository>();

			IRecurringJobService recurringJobService =
				scope.ServiceProvider
					.GetRequiredService<IRecurringJobService>();

			IReadOnlyList<RecurringJobExecution> executions =
				await repository.GetAllAsync(cancellationToken);

			Dictionary<string, RecurringJobExecution> executionsByName =
				executions.ToDictionary(
					execution => execution.JobName,
					execution => execution);

			List<(string JobName, TimeSpan Interval, Func<IRecurringJobService, CancellationToken, Task> RebootstrapAsync)> watchedJobs =
				BuildWatchedJobList();

			foreach ((string jobName, TimeSpan interval, Func<IRecurringJobService, CancellationToken, Task> rebootstrapAsync) in watchedJobs)
			{
				bool isStale =
					IsJobStale(
						jobName,
						interval,
						executionsByName);

				if (isStale)
				{
					logger.LogWarning(
						"Watchdog: re-bootstrapping stale job chain '{JobName}'",
						jobName);

					await rebootstrapAsync(
						recurringJobService,
						cancellationToken);
				}
			}
		}
		catch (DbException exception)
		{
			logger.LogError(
				exception,
				"Watchdog: failed to check job chain health.");
		}
		catch (InvalidOperationException exception)
		{
			logger.LogError(
				exception,
				"Watchdog: failed to check job chain health.");
		}
	}

	/// <summary>
	/// Determines whether a job is stale based on its last execution time.
	/// A job is stale if it hasn't executed within max(3x interval, 10 minutes).
	/// Jobs that have never executed (no record or MinValue) are always stale.
	/// </summary>
	/// <param name="jobName">
	/// The job identifier.
	/// </param>
	/// <param name="interval">
	/// The expected execution interval.
	/// </param>
	/// <param name="executionsByName">
	/// All known executions keyed by job name.
	/// </param>
	/// <returns>
	/// True if the job is stale and needs re-bootstrapping.
	/// </returns>
	internal bool IsJobStale(
		string jobName,
		TimeSpan interval,
		Dictionary<string, RecurringJobExecution> executionsByName)
	{
		if (!executionsByName.TryGetValue(
			jobName,
			out RecurringJobExecution? execution))
		{
			return true;
		}

		if (execution.LastExecutedAt == DateTimeOffset.MinValue)
		{
			return true;
		}

		DateTimeOffset now =
			timeProvider.GetUtcNow();

		if (execution.NextScheduledAt.HasValue
			&& execution.NextScheduledAt.Value > now)
		{
			return false;
		}

		TimeSpan stalenessThreshold =
			interval * StalenessMultiplier;

		if (stalenessThreshold < MinimumStalenessThreshold)
		{
			stalenessThreshold =
				MinimumStalenessThreshold;
		}

		TimeSpan timeSinceLastExecution =
			now - execution.LastExecutedAt;

		return timeSinceLastExecution > stalenessThreshold;
	}

	/// <summary>
	/// Builds the list of watched jobs with their intervals and re-bootstrap delegates.
	/// </summary>
	/// <returns>
	/// A list of tuples containing job name, interval, and re-bootstrap delegate.
	/// </returns>
	private List<(string JobName, TimeSpan Interval, Func<IRecurringJobService, CancellationToken, Task> RebootstrapAsync)> BuildWatchedJobList()
	{
		List<(string JobName, TimeSpan Interval, Func<IRecurringJobService, CancellationToken, Task> RebootstrapAsync)> watchedJobs =
			[];

		if (emailQueueSettings.Value.Enabled)
		{
			watchedJobs.Add(
				(
					nameof(EmailQueueProcessJob),
					TimeSpan.FromSeconds(emailQueueSettings.Value.ProcessingIntervalSeconds),
					(service, cancellationToken) =>
						service.EnsureScheduledAsync<EmailQueueProcessJob>(
							nameof(EmailQueueProcessJob),
							TimeSpan.FromSeconds(emailQueueSettings.Value.ProcessingIntervalSeconds),
							cancellationToken)
				));
		}

		if (logCleanupSettings.Value.Enabled)
		{
			TimeOnly logCleanupPreferredTimeUtc =
				new(
					logCleanupSettings.Value.PreferredStartHourUtc,
					logCleanupSettings.Value.PreferredStartMinuteUtc);

			watchedJobs.Add(
				(
					nameof(LogCleanupJob),
					TimeSpan.FromHours(logCleanupSettings.Value.IntervalHours),
					(service, cancellationToken) =>
						service.EnsureScheduledAtPreferredTimeAsync<LogCleanupJob>(
							nameof(LogCleanupJob),
							logCleanupPreferredTimeUtc,
							TimeSpan.FromHours(logCleanupSettings.Value.IntervalHours),
							cancellationToken)
				));
		}

		if (databaseMaintenanceSettings.Value.Enabled)
		{
			TimeOnly databaseMaintenancePreferredTimeUtc =
				new(
					databaseMaintenanceSettings.Value.PreferredStartHourUtc,
					databaseMaintenanceSettings.Value.PreferredStartMinuteUtc);

			watchedJobs.Add(
				(
					nameof(DatabaseMaintenanceJob),
					TimeSpan.FromHours(databaseMaintenanceSettings.Value.IntervalHours),
					(service, cancellationToken) =>
						service.EnsureScheduledAtPreferredTimeAsync<DatabaseMaintenanceJob>(
							nameof(DatabaseMaintenanceJob),
							databaseMaintenancePreferredTimeUtc,
							TimeSpan.FromHours(databaseMaintenanceSettings.Value.IntervalHours),
							cancellationToken)
				));
		}

		if (refreshTokenCleanupSettings.Value.Enabled)
		{
			TimeOnly refreshTokenPreferredTimeUtc =
				new(
					refreshTokenCleanupSettings.Value.PreferredStartHourUtc,
					refreshTokenCleanupSettings.Value.PreferredStartMinuteUtc);

			watchedJobs.Add(
				(
					nameof(RefreshTokenCleanupJob),
					TimeSpan.FromHours(refreshTokenCleanupSettings.Value.IntervalHours),
					(service, cancellationToken) =>
						service.EnsureScheduledAtPreferredTimeAsync<RefreshTokenCleanupJob>(
							nameof(RefreshTokenCleanupJob),
							refreshTokenPreferredTimeUtc,
							TimeSpan.FromHours(refreshTokenCleanupSettings.Value.IntervalHours),
							cancellationToken)
				));
		}

		if (orphanedRegistrationCleanupSettings.Value.Enabled)
		{
			TimeOnly orphanedRegistrationPreferredTimeUtc =
				new(
					orphanedRegistrationCleanupSettings.Value.PreferredStartHourUtc,
					orphanedRegistrationCleanupSettings.Value.PreferredStartMinuteUtc);

			watchedJobs.Add(
				(
					nameof(OrphanedRegistrationCleanupJob),
					TimeSpan.FromHours(orphanedRegistrationCleanupSettings.Value.IntervalHours),
					(service, cancellationToken) =>
						service.EnsureScheduledAtPreferredTimeAsync<OrphanedRegistrationCleanupJob>(
							nameof(OrphanedRegistrationCleanupJob),
							orphanedRegistrationPreferredTimeUtc,
							TimeSpan.FromHours(orphanedRegistrationCleanupSettings.Value.IntervalHours),
							cancellationToken)
				));
		}

		return watchedJobs;
	}
}