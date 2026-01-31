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

	/// <inheritdoc />
	public async Task EnsureScheduledAtPreferredTimeAsync<TJob>(
		string jobName,
		TimeOnly preferredTimeUtc,
		TimeSpan interval,
		CancellationToken cancellationToken = default)
		where TJob : class, new()
	{
		DateTimeOffset currentTime =
			timeProvider.GetUtcNow();

		RecurringJobExecution? lastExecution =
			await repository.GetLastExecutionAsync(
				jobName,
				cancellationToken);

		DateTimeOffset nextPreferredTime =
			CalculateNextPreferredTime(
				currentTime,
				preferredTimeUtc);

		// Create or update execution record with scheduled time
		// This ensures NextScheduledAt is always populated, even before first run
		RecurringJobExecution execution =
			new()
			{
				JobName = jobName,
				LastExecutedAt = lastExecution?.LastExecutedAt ?? DateTimeOffset.MinValue,
				NextScheduledAt = nextPreferredTime,
				LastExecutedBy = lastExecution?.LastExecutedBy ?? "Not yet run"
			};

		await repository.UpsertExecutionAsync(
			execution,
			cancellationToken);

		await scheduler.ScheduleAsync(
			new TJob(),
			nextPreferredTime,
			cancellationToken);
	}

	/// <summary>
	/// Calculates the next occurrence of the preferred UTC time.
	/// If the preferred time has already passed today, returns tomorrow at that time.
	/// </summary>
	/// <param name="currentTime">
	/// Current UTC time.
	/// </param>
	/// <param name="preferredTimeUtc">
	/// Target time (hour and minute).
	/// </param>
	/// <returns>
	/// The next occurrence of the preferred time.
	/// </returns>
	internal static DateTimeOffset CalculateNextPreferredTime(
		DateTimeOffset currentTime,
		TimeOnly preferredTimeUtc)
	{
		DateTimeOffset todayAtPreferredTime =
			new(
				currentTime.Year,
				currentTime.Month,
				currentTime.Day,
				preferredTimeUtc.Hour,
				preferredTimeUtc.Minute,
				0,
				TimeSpan.Zero);

		// If preferred time already passed today, schedule for tomorrow
		return currentTime.TimeOfDay >= preferredTimeUtc.ToTimeSpan()
			? todayAtPreferredTime.AddDays(1)
			: todayAtPreferredTime;
	}
}