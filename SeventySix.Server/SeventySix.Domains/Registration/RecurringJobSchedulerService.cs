// <copyright file="RecurringJobSchedulerService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.ElectronicNotifications.Emails.Jobs;
using SeventySix.Logging;
using SeventySix.Logging.Jobs;
using SeventySix.Shared.BackgroundJobs;
using SeventySix.Shared.Constants;

namespace SeventySix.Registration;

/// <summary>
/// Schedules all recurring jobs on application startup.
/// Includes resilient startup with bounded retry for Docker environments.
/// </summary>
/// <remarks>
/// <para>
/// This service uses a BOUNDED retry strategy to handle transient database
/// connectivity issues during container startup. It will NEVER loop forever:
/// </para>
/// <list type="bullet">
/// <item><description>Initial delay: 3 seconds (allows DB to stabilize)</description></item>
/// <item><description>Max retry attempts: 3 (hardcoded constant)</description></item>
/// <item><description>Retry delays: 2s, 4s (exponential backoff)</description></item>
/// <item><description>Total max wait: 9 seconds before giving up</description></item>
/// </list>
/// <para>
/// If all retries fail, the service logs an error but allows the application
/// to continue running (graceful degradation - background jobs won't run
/// but API endpoints remain functional).
/// </para>
/// </remarks>
/// <param name="serviceScopeFactory">
/// Factory for creating service scopes.
/// </param>
/// <param name="configuration">
/// Application configuration for reading job settings.
/// </param>
/// <param name="logger">
/// Logger for diagnostic messages.
/// </param>
public sealed class RecurringJobSchedulerService(
	IServiceScopeFactory serviceScopeFactory,
	IConfiguration configuration,
	ILogger<RecurringJobSchedulerService> logger) : IHostedService
{
	/// <summary>
	/// Delay before attempting job scheduling to allow database to stabilize.
	/// </summary>
	private const int StartupDelaySeconds = 3;

	/// <summary>
	/// Maximum number of retry attempts for job scheduling.
	/// This ensures we NEVER loop forever - after this many attempts, we give up.
	/// </summary>
	private const int MaxRetryAttempts = 3;

	/// <summary>
	/// Schedules all recurring jobs on startup with resilient retry logic.
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

		// Allow database connections to stabilize after container startup
		logger.LogInformation(
			"Waiting {DelaySeconds}s for database to stabilize",
			StartupDelaySeconds);

		try
		{
			await Task.Delay(
				TimeSpan.FromSeconds(StartupDelaySeconds),
				cancellationToken);
		}
		catch (OperationCanceledException)
		{
			// Startup cancelled during initial delay - exit cleanly
			logger.LogInformation("Job scheduler startup cancelled during initial delay");
			return;
		}

		// BOUNDED retry with exponential backoff - will exit after MaxRetryAttempts
		for (int attemptNumber = 1; attemptNumber <= MaxRetryAttempts; attemptNumber++)
		{
			try
			{
				await ScheduleAllJobsAsync(cancellationToken);

				logger.LogInformation(
					"Recurring job scheduler completed startup scheduling");
				return; // SUCCESS - exit method
			}
			catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
			{
				// Graceful shutdown requested - exit cleanly
				logger.LogInformation("Job scheduler startup cancelled");
				return; // CANCELLED - exit method
			}
			catch (Exception exception) when (attemptNumber < MaxRetryAttempts)
			{
				int retryDelaySeconds =
					attemptNumber * 2; // 2s, 4s

				logger.LogWarning(
					exception,
					"Job scheduling attempt {AttemptNumber}/{MaxAttempts} failed, retrying in {RetryDelaySeconds}s",
					attemptNumber,
					MaxRetryAttempts,
					retryDelaySeconds);

				await Task.Delay(
					TimeSpan.FromSeconds(retryDelaySeconds),
					cancellationToken);
			}
		}

		// FAILURE after all retries - log error but DON'T crash the app
		// API will still function, just without background job processing
		logger.LogError(
			"Failed to schedule recurring jobs after {MaxAttempts} attempts. " +
			"Background jobs will not run but API remains functional.",
			MaxRetryAttempts);
		// Method exits here - no infinite loop
	}

	/// <inheritdoc />
	public Task StopAsync(CancellationToken cancellationToken) =>
		Task.CompletedTask;

	/// <summary>
	/// Schedules all domain recurring jobs.
	/// </summary>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	private async Task ScheduleAllJobsAsync(CancellationToken cancellationToken)
	{
		await using AsyncServiceScope scope =
			serviceScopeFactory.CreateAsyncScope();

		IRecurringJobService recurringJobService =
			scope.ServiceProvider.GetRequiredService<IRecurringJobService>();

		// Schedule jobs from all bounded context contributors
		// Each domain registers its own IJobSchedulerContributor implementation
		IEnumerable<IJobSchedulerContributor> contributors =
			scope.ServiceProvider.GetServices<IJobSchedulerContributor>();

		foreach (IJobSchedulerContributor contributor in contributors)
		{
			await contributor.ScheduleJobsAsync(
				recurringJobService,
				cancellationToken);
		}

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
			?? new();

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