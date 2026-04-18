// <copyright file="RecurringJobSchedulerService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Data.Common;
using System.Diagnostics.CodeAnalysis;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SeventySix.Shared.BackgroundJobs;
using SeventySix.Shared.Constants;

namespace SeventySix.Registration;

/// <summary>
/// Schedules all recurring jobs on application startup via per-domain
/// <see cref="IJobSchedulerContributor"/> implementations.
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
/// <para>
/// Domain-specific job scheduling is delegated to
/// <see cref="IJobSchedulerContributor"/> implementations registered per
/// bounded context. This service owns only the lifecycle/retry concerns.
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
[ExcludeFromCodeCoverage]
public sealed class RecurringJobSchedulerService(
	IServiceScopeFactory serviceScopeFactory,
	IConfiguration configuration,
	ILogger<RecurringJobSchedulerService> logger) : BackgroundService
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
	/// Multiplier applied to the attempt number to compute the exponential
	/// backoff delay between retries (attempt 1 → 2s, attempt 2 → 4s).
	/// </summary>
	private const int RetryBackoffMultiplierSeconds = 2;

	/// <summary>
	/// Schedules all recurring jobs on startup with resilient retry logic.
	/// </summary>
	/// <param name="stoppingToken">
	/// The cancellation token used to signal application shutdown.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	protected override async Task ExecuteAsync(CancellationToken stoppingToken)
	{
		bool isBackgroundJobsEnabled =
			configuration.GetValue<bool>(ConfigurationSectionConstants.BackgroundJobs.Enabled);

		if (!isBackgroundJobsEnabled)
		{
			logger.LogInformation("Background jobs are disabled");
			return;
		}

		logger.LogInformation(
			"Waiting {DelaySeconds}s for database to stabilize",
			StartupDelaySeconds);

		try
		{
			await Task.Delay(
				TimeSpan.FromSeconds(StartupDelaySeconds),
				stoppingToken);
		}
		catch (OperationCanceledException)
		{
			logger.LogInformation("Job scheduler startup cancelled during initial delay");
			return;
		}

		for (int attemptNumber = 1; attemptNumber <= MaxRetryAttempts; attemptNumber++)
		{
			try
			{
				await ScheduleAllJobsAsync(stoppingToken);

				logger.LogInformation(
					"Recurring job scheduler completed startup scheduling");
				return;
			}
			catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
			{
				logger.LogInformation("Job scheduler startup cancelled");
				return;
			}
			catch (DbException exception) when (attemptNumber < MaxRetryAttempts)
			{
				await DelayBeforeRetryAsync(
					exception,
					attemptNumber,
					stoppingToken);
			}
			catch (InvalidOperationException exception) when (attemptNumber < MaxRetryAttempts)
			{
				await DelayBeforeRetryAsync(
					exception,
					attemptNumber,
					stoppingToken);
			}
		}

		logger.LogError(
			"Failed to schedule recurring jobs after {MaxAttempts} attempts. " +
			"Background jobs will not run but API remains functional.",
			MaxRetryAttempts);
	}

	/// <summary>
	/// Dispatches scheduling to all registered
	/// <see cref="IJobSchedulerContributor"/> implementations.
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

		IEnumerable<IJobSchedulerContributor> contributors =
			scope.ServiceProvider.GetServices<IJobSchedulerContributor>();

		foreach (IJobSchedulerContributor contributor in contributors)
		{
			await contributor.ScheduleJobsAsync(
				recurringJobService,
				cancellationToken);
		}
	}

	/// <summary>
	/// Logs a retry warning and waits using exponential backoff derived from
	/// <see cref="RetryBackoffMultiplierSeconds"/>.
	/// </summary>
	/// <param name="exception">
	/// The transient exception that triggered the retry.
	/// </param>
	/// <param name="attemptNumber">
	/// The current (1-based) retry attempt number.
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the delay.
	/// </returns>
	private async Task DelayBeforeRetryAsync(
		Exception exception,
		int attemptNumber,
		CancellationToken cancellationToken)
	{
		int retryDelaySeconds =
			attemptNumber * RetryBackoffMultiplierSeconds;

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