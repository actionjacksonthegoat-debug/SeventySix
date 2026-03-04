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
			// Never run before — schedule one full interval from now
			nextRun =
				now.Add(interval);
		}
		else
		{
			// Calculate when it should run next
			nextRun =
				lastExecution.LastExecutedAt.Add(interval);

			// If overdue, advance to the next interval-aligned slot
			if (nextRun <= now)
			{
				nextRun =
					AdvanceToNextInterval(
						lastExecution.LastExecutedAt,
						interval,
						now);
			}
		}

		await scheduler.ScheduleAsync(
			new TJob(),
			nextRun,
			cancellationToken);

		// Always update DB so NextScheduledAt reflects the actual scheduled time
		RecurringJobExecution updatedExecution =
			new()
			{
				JobName = jobName,
				LastExecutedAt = lastExecution?.LastExecutedAt ?? DateTimeOffset.MinValue,
				NextScheduledAt = nextRun,
				LastExecutedBy = lastExecution?.LastExecutedBy ?? "Not yet run"
			};

		await repository.UpsertExecutionAsync(
			updatedExecution,
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
		DateTimeOffset now =
			timeProvider.GetUtcNow();

		DateTimeOffset nextScheduledAt =
			executedAt.Add(interval);

		// If computed time is in the past, advance to the next interval boundary
		if (nextScheduledAt <= now)
		{
			nextScheduledAt =
				AdvanceToNextInterval(
					executedAt,
					interval,
					now);
		}

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
	/// Advances from a base time by multiples of the interval until the result
	/// is strictly after <paramref name="now"/>. This preserves the natural
	/// interval-aligned cadence instead of firing jobs immediately.
	/// </summary>
	/// <param name="baseTime">
	/// The anchor point (e.g. last execution time).
	/// </param>
	/// <param name="interval">
	/// The recurring interval.
	/// </param>
	/// <param name="now">
	/// The current UTC time.
	/// </param>
	/// <returns>
	/// The next interval-aligned time strictly after <paramref name="now"/>.
	/// </returns>
	internal static DateTimeOffset AdvanceToNextInterval(
		DateTimeOffset baseTime,
		TimeSpan interval,
		DateTimeOffset now)
	{
		long elapsedTicks =
			(now - baseTime).Ticks;

		long intervalTicks =
			interval.Ticks;

		long periodsToSkip =
			(elapsedTicks / intervalTicks) + 1;

		return baseTime.AddTicks(intervalTicks * periodsToSkip);
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