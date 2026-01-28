// <copyright file="RecurringJobService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.BackgroundJobs;

/// <summary>
/// Default implementation of <see cref="IRecurringJobService"/>.
/// Framework-agnostic; depends only on abstractions.
/// </summary>
/// <param name="repository">
/// The repository for job execution tracking.
/// </param>
/// <param name="scheduler">
/// The message scheduler for delayed delivery.
/// </param>
/// <param name="timeProvider">
/// Provides current time for scheduling calculations.
/// </param>
public sealed class RecurringJobService(
	IRecurringJobRepository repository,
	IMessageScheduler scheduler,
	TimeProvider timeProvider) : IRecurringJobService
{
	/// <inheritdoc />
	public async Task EnsureScheduledAsync<TJob>(
		string jobName,
		TimeSpan interval,
		CancellationToken cancellationToken = default)
		where TJob : class, new()
	{
		DateTimeOffset now =
			timeProvider.GetUtcNow();

		RecurringJobExecution? lastExecution =
			await repository.GetLastExecutionAsync(
				jobName,
				cancellationToken);

		DateTimeOffset nextRun;

		if (lastExecution is null)
		{
			// Never run before - schedule 1 second in the future to avoid race conditions
			nextRun =
				now.AddSeconds(1);
		}
		else
		{
			// Calculate when it should run next
			nextRun =
				lastExecution.LastExecutedAt.Add(interval);

			// If overdue, run 1 second in the future to avoid race conditions
			if (nextRun <= now)
			{
				nextRun =
					now.AddSeconds(1);
			}
		}

		await scheduler.ScheduleAsync(
			new TJob(),
			nextRun,
			cancellationToken);
	}

	/// <inheritdoc />
	public async Task RecordAndScheduleNextAsync<TJob>(
		string jobName,
		DateTimeOffset executedAt,
		TimeSpan interval,
		CancellationToken cancellationToken = default)
		where TJob : class, new()
	{
		DateTimeOffset nextScheduledAt =
			executedAt.Add(interval);

		RecurringJobExecution execution =
			new()
			{
				JobName = jobName,
				LastExecutedAt = executedAt,
				NextScheduledAt = nextScheduledAt,
				LastExecutedBy = Environment.MachineName
			};

		await repository.UpsertExecutionAsync(
			execution,
			cancellationToken);

		await scheduler.ScheduleAsync(
			new TJob(),
			nextScheduledAt,
			cancellationToken);
	}
}