// <copyright file="RecurringJobSchedulerService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.ElectronicNotifications.Emails.Jobs;
using SeventySix.Identity.Jobs;
using SeventySix.Identity.Settings;
using SeventySix.Logging;
using SeventySix.Logging.Jobs;
using SeventySix.Shared.BackgroundJobs;
using SeventySix.Shared.Constants;

namespace SeventySix.Registration;

/// <summary>
/// Schedules all recurring jobs on application startup.
/// Checks last execution times to resume scheduling after container restart.
/// </summary>
/// <param name="serviceScopeFactory">
/// Factory for creating service scopes.
/// </param>
/// <param name="configuration">
/// Application configuration for reading job settings.
/// </param>
/// <param name="logger">
/// Logger for diagnostic messages.
/// </param>
public class RecurringJobSchedulerService(
	IServiceScopeFactory serviceScopeFactory,
	IConfiguration configuration,
	ILogger<RecurringJobSchedulerService> logger) : IHostedService
{
	/// <summary>
	/// Schedules all recurring jobs on startup.
	/// </summary>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	public async Task StartAsync(CancellationToken cancellationToken)
	{
		bool backgroundJobsEnabled =
			configuration.GetValue<bool?>("BackgroundJobs:Enabled") ?? true;

		if (!backgroundJobsEnabled)
		{
			logger.LogInformation("Background jobs are disabled");
			return;
		}

		await using AsyncServiceScope scope =
			serviceScopeFactory.CreateAsyncScope();

		IRecurringJobService recurringJobService =
			scope.ServiceProvider.GetRequiredService<IRecurringJobService>();

		// Schedule Identity domain jobs
		await ScheduleRefreshTokenCleanupJobAsync(
			recurringJobService,
			cancellationToken);

		await ScheduleIpAnonymizationJobAsync(
			recurringJobService,
			cancellationToken);

		// Schedule ElectronicNotifications domain jobs
		await ScheduleEmailQueueProcessJobAsync(
			recurringJobService,
			cancellationToken);

		// Schedule Logging domain jobs
		await ScheduleLogCleanupJobAsync(
			recurringJobService,
			cancellationToken);

		await ScheduleDatabaseMaintenanceJobAsync(
			recurringJobService,
			cancellationToken);

		logger.LogInformation(
			"Recurring job scheduler completed startup scheduling");
	}

	/// <inheritdoc />
	public Task StopAsync(CancellationToken cancellationToken) =>
		Task.CompletedTask;

	/// <summary>
	/// Schedules the refresh token cleanup job.
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
	private async Task ScheduleRefreshTokenCleanupJobAsync(
		IRecurringJobService recurringJobService,
		CancellationToken cancellationToken)
	{
		RefreshTokenCleanupSettings settings =
			configuration
				.GetSection(RefreshTokenCleanupSettings.SectionName)
				.Get<RefreshTokenCleanupSettings>()
			?? new();

		TimeSpan interval =
			TimeSpan.FromHours(settings.IntervalHours);

		await recurringJobService.EnsureScheduledAsync<RefreshTokenCleanupJob>(
			nameof(RefreshTokenCleanupJob),
			interval,
			cancellationToken);

		logger.LogInformation(
			"Scheduled {JobName} with interval {Interval}",
			nameof(RefreshTokenCleanupJob),
			interval);
	}

	/// <summary>
	/// Schedules the IP anonymization job for GDPR compliance.
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
	private async Task ScheduleIpAnonymizationJobAsync(
		IRecurringJobService recurringJobService,
		CancellationToken cancellationToken)
	{
		IpAnonymizationSettings settings =
			configuration
				.GetSection(IpAnonymizationSettings.SectionName)
				.Get<IpAnonymizationSettings>()
			?? new();

		TimeSpan interval =
			TimeSpan.FromDays(settings.IntervalDays);

		await recurringJobService.EnsureScheduledAsync<IpAnonymizationJob>(
			nameof(IpAnonymizationJob),
			interval,
			cancellationToken);

		logger.LogInformation(
			"Scheduled {JobName} with interval {Interval}",
			nameof(IpAnonymizationJob),
			interval);
	}

	/// <summary>
	/// Schedules the email queue processing job if enabled.
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
	private async Task ScheduleEmailQueueProcessJobAsync(
		IRecurringJobService recurringJobService,
		CancellationToken cancellationToken)
	{
		EmailSettings emailSettings =
			configuration.GetSection(ConfigurationSectionConstants.Email).Get<EmailSettings>() ?? new();

		EmailQueueSettings queueSettings =
			configuration
				.GetSection(EmailQueueSettings.SectionName)
				.Get<EmailQueueSettings>()
			?? new();

		if (!emailSettings.Enabled || !queueSettings.Enabled)
		{
			logger.LogInformation(
				"Skipping {JobName} - email or queue processing disabled",
				nameof(EmailQueueProcessJob));
			return;
		}

		TimeSpan interval =
			TimeSpan.FromSeconds(
				queueSettings.ProcessingIntervalSeconds);

		await recurringJobService.EnsureScheduledAsync<EmailQueueProcessJob>(
			nameof(EmailQueueProcessJob),
			interval,
			cancellationToken);

		logger.LogInformation(
			"Scheduled {JobName} with interval {Interval}",
			nameof(EmailQueueProcessJob),
			interval);
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
			?? new();

		if (!settings.Enabled)
		{
			logger.LogInformation(
				"Skipping {JobName} - log cleanup disabled",
				nameof(LogCleanupJob));
			return;
		}

		TimeSpan interval =
			TimeSpan.FromHours(settings.IntervalHours);

		await recurringJobService.EnsureScheduledAsync<LogCleanupJob>(
			nameof(LogCleanupJob),
			interval,
			cancellationToken);

		logger.LogInformation(
			"Scheduled {JobName} with interval {Interval}",
			nameof(LogCleanupJob),
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
			?? new();

		if (!settings.Enabled)
		{
			logger.LogInformation(
				"Skipping {JobName} - database maintenance disabled",
				nameof(DatabaseMaintenanceJob));
			return;
		}

		TimeSpan interval =
			TimeSpan.FromHours(settings.IntervalHours);

		await recurringJobService.EnsureScheduledAsync<DatabaseMaintenanceJob>(
			nameof(DatabaseMaintenanceJob),
			interval,
			cancellationToken);

		logger.LogInformation(
			"Scheduled {JobName} with interval {Interval}",
			nameof(DatabaseMaintenanceJob),
			interval);
	}
}