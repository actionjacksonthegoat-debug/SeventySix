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

		DateTimeOffset nextRun =
			GetNextIntervalRunTime(
				now,
				interval,
				lastExecution?.NextScheduledAt);

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
			GetNextIntervalRunTime(
				now,
				interval,
				null);

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
	public async Task RecordAndScheduleNextAnchoredAsync<TJob>(
		string jobName,
		DateTimeOffset executedAt,
		TimeOnly preferredTimeUtc,
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

		DateTimeOffset anchor =
			ResolveAnchor(
				now,
				preferredTimeUtc,
				lastExecution?.NextScheduledAt,
				interval);

		DateTimeOffset nextScheduledAt =
			GetNextAnchoredRunTime(
				anchor,
				interval,
				now);

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

		DateTimeOffset anchor =
			ResolveAnchor(
				currentTime,
				preferredTimeUtc,
				lastExecution?.NextScheduledAt,
				interval);

		DateTimeOffset nextPreferredTime =
			GetNextAnchoredRunTime(
				anchor,
				interval,
				currentTime);

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

	internal static DateTimeOffset GetNextIntervalRunTime(
		DateTimeOffset now,
		TimeSpan interval,
		DateTimeOffset? existingNextScheduledAt)
	{
		if (existingNextScheduledAt.HasValue
			&& existingNextScheduledAt.Value > now)
		{
			return existingNextScheduledAt.Value;
		}

		return now.Add(interval);
	}

	internal static DateTimeOffset GetNextAnchoredRunTime(
		DateTimeOffset anchor,
		TimeSpan interval,
		DateTimeOffset now)
	{
		if (anchor > now)
		{
			return anchor;
		}

		return AdvanceToNextInterval(
			anchor,
			interval,
			now);
	}

	internal static DateTimeOffset ResolveAnchor(
		DateTimeOffset now,
		TimeOnly preferredTimeUtc,
		DateTimeOffset? existingNextScheduledAt,
		TimeSpan interval)
	{
		if (existingNextScheduledAt.HasValue)
		{
			return existingNextScheduledAt.Value;
		}

		DateTimeOffset nextPreferredTime =
			CalculateNextPreferredTime(
				now,
				preferredTimeUtc);

		return nextPreferredTime.AddTicks(-interval.Ticks);
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