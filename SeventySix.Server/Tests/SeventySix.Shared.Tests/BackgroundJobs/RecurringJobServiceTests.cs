// <copyright file="RecurringJobServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Shared.BackgroundJobs;
using SeventySix.TestUtilities.Constants;
using Shouldly;

namespace SeventySix.Shared.Tests.BackgroundJobs;

/// <summary>
/// Unit tests for <see cref="RecurringJobService"/>.
/// </summary>
public sealed class RecurringJobServiceTests
{
	private readonly FakeTimeProvider TimeProvider;
	private readonly IRecurringJobRepository Repository;
	private readonly IMessageScheduler Scheduler;
	private readonly RecurringJobService Service;

	/// <summary>
	/// Initializes a new instance of the <see cref="RecurringJobServiceTests"/> class.
	/// </summary>
	public RecurringJobServiceTests()
	{
		TimeProvider =
			TestDates.CreateFutureTimeProvider();

		Repository =
			Substitute.For<IRecurringJobRepository>();

		Scheduler =
			Substitute.For<IMessageScheduler>();

		Service =
			new RecurringJobService(
				Repository,
				Scheduler,
				TimeProvider);
	}

	/// <summary>
	/// When a job has never been executed, it should be scheduled one full interval from now.
	/// </summary>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	[Fact]
	public async Task EnsureScheduledAsync_WhenNeverExecuted_SchedulesAfterOneIntervalAsync()
	{
		// Arrange
		TimeSpan interval =
			TimeSpan.FromHours(24);

		Repository
			.GetLastExecutionAsync(
				Arg.Any<string>(),
				Arg.Any<CancellationToken>())
			.Returns(default(RecurringJobExecution?));

		// Act
		await Service.EnsureScheduledAsync<TestJob>(
			"TestJob",
			interval,
			CancellationToken.None);

		// Assert - schedules one full interval from now (not immediately)
		DateTimeOffset expectedNextRun =
			TimeProvider.GetUtcNow().Add(interval);

		await Scheduler
			.Received(1)
			.ScheduleAsync(
				Arg.Any<TestJob>(),
				expectedNextRun,
				Arg.Any<CancellationToken>());

		// Assert - DB updated with NextScheduledAt
		await Repository
			.Received(1)
			.UpsertExecutionAsync(
				Arg.Is<RecurringJobExecution>(execution =>
					execution.JobName == "TestJob"
					&& execution.LastExecutedAt == DateTimeOffset.MinValue
					&& execution.NextScheduledAt == expectedNextRun
					&& execution.LastExecutedBy == "Not yet run"),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// When a job is overdue, it should advance to the next interval-aligned time.
	/// </summary>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	[Fact]
	public async Task EnsureScheduledAsync_WhenOverdue_AdvancesToNextIntervalAsync()
	{
		// Arrange - last execution 2 days ago, interval is 1 day
		DateTimeOffset now =
			TimeProvider.GetUtcNow();

		DateTimeOffset lastExecuted =
			now.AddDays(-2);

		TimeSpan interval =
			TimeSpan.FromDays(1);

		Repository
			.GetLastExecutionAsync(
				"TestJob",
				Arg.Any<CancellationToken>())
			.Returns(new RecurringJobExecution
			{
				JobName = "TestJob",
				LastExecutedAt = lastExecuted
			});

		// Act
		await Service.EnsureScheduledAsync<TestJob>(
			"TestJob",
			interval,
			CancellationToken.None);

		// Assert - advances to next interval boundary (lastExecuted + 3d = now + 1d)
		DateTimeOffset expectedNextRun =
			lastExecuted.AddDays(3);

		expectedNextRun.ShouldBeGreaterThan(now);

		await Scheduler
			.Received(1)
			.ScheduleAsync(
				Arg.Any<TestJob>(),
				expectedNextRun,
				Arg.Any<CancellationToken>());

		// Assert - DB updated with NextScheduledAt and original LastExecutedAt preserved
		await Repository
			.Received(1)
			.UpsertExecutionAsync(
				Arg.Is<RecurringJobExecution>(execution =>
					execution.JobName == "TestJob"
					&& execution.LastExecutedAt == lastExecuted
					&& execution.NextScheduledAt == expectedNextRun),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// When a job is not yet due, it should be scheduled at the correct future time.
	/// </summary>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	[Fact]
	public async Task EnsureScheduledAsync_WhenNotYetDue_SchedulesAtNextIntervalAsync()
	{
		// Arrange - last execution 1 hour ago, interval is 24 hours
		DateTimeOffset lastExecuted =
			TimeProvider.GetUtcNow().AddHours(-1);

		Repository
			.GetLastExecutionAsync(
				"TestJob",
				Arg.Any<CancellationToken>())
			.Returns(new RecurringJobExecution
			{
				JobName = "TestJob",
				LastExecutedAt = lastExecuted
			});

		// Act
		await Service.EnsureScheduledAsync<TestJob>(
			"TestJob",
			TimeSpan.FromHours(24),
			CancellationToken.None);

		// Assert - schedules for 23 hours from now
		DateTimeOffset expectedNextRun =
			lastExecuted.AddHours(24);

		await Scheduler
			.Received(1)
			.ScheduleAsync(
				Arg.Any<TestJob>(),
				expectedNextRun,
				Arg.Any<CancellationToken>());

		// Assert - DB updated with NextScheduledAt
		await Repository
			.Received(1)
			.UpsertExecutionAsync(
				Arg.Is<RecurringJobExecution>(execution =>
					execution.JobName == "TestJob"
					&& execution.LastExecutedAt == lastExecuted
					&& execution.NextScheduledAt == expectedNextRun),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// RecordAndScheduleNextAsync should persist execution and schedule the next run.
	/// </summary>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	[Fact]
	public async Task RecordAndScheduleNextAsync_PersistsExecutionAndSchedulesAsync()
	{
		// Arrange
		DateTimeOffset executedAt =
			TimeProvider.GetUtcNow();

		TimeSpan interval =
			TimeSpan.FromHours(24);

		// Act
		await Service.RecordAndScheduleNextAsync<TestJob>(
			"TestJob",
			executedAt,
			interval,
			CancellationToken.None);

		// Assert - repository.UpsertExecutionAsync called with correct values
		await Repository
			.Received(1)
			.UpsertExecutionAsync(
				Arg.Is<RecurringJobExecution>(execution =>
					execution.JobName == "TestJob"
					&& execution.LastExecutedAt == executedAt
					&& execution.NextScheduledAt == executedAt.Add(interval)),
				Arg.Any<CancellationToken>());

		// Assert - scheduler.ScheduleAsync called with correct next time
		DateTimeOffset expectedNextRun =
			executedAt.Add(interval);

		await Scheduler
			.Received(1)
			.ScheduleAsync(
				Arg.Any<TestJob>(),
				expectedNextRun,
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// RecordAndScheduleNextAsync should set the machine name on the execution record.
	/// </summary>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	[Fact]
	public async Task RecordAndScheduleNextAsync_SetsLastExecutedByToMachineNameAsync()
	{
		// Arrange
		DateTimeOffset executedAt =
			TimeProvider.GetUtcNow();

		// Act
		await Service.RecordAndScheduleNextAsync<TestJob>(
			"TestJob",
			executedAt,
			TimeSpan.FromHours(24),
			CancellationToken.None);

		// Assert
		await Repository
			.Received(1)
			.UpsertExecutionAsync(
				Arg.Is<RecurringJobExecution>(execution =>
					execution.LastExecutedBy == Environment.MachineName),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// CalculateNextPreferredTime returns same day when before preferred time.
	/// </summary>
	[Fact]
	public void CalculateNextPreferredTime_BeforePreferredTime_ReturnsSameDay()
	{
		// Arrange - 6:00 AM UTC, preferred time is 8:10 UTC
		DateTimeOffset currentTime =
			new(2026, 1, 30, 6, 0, 0, TimeSpan.Zero);

		TimeOnly preferredTimeUtc =
			new(8, 10);

		// Act
		DateTimeOffset result =
			RecurringJobService.CalculateNextPreferredTime(
				currentTime,
				preferredTimeUtc);

		// Assert
		result.ShouldBe(new DateTimeOffset(2026, 1, 30, 8, 10, 0, TimeSpan.Zero));
	}

	/// <summary>
	/// CalculateNextPreferredTime returns next day when after preferred time.
	/// </summary>
	[Fact]
	public void CalculateNextPreferredTime_AfterPreferredTime_ReturnsNextDay()
	{
		// Arrange - 10:00 AM UTC, preferred time is 8:10 UTC
		DateTimeOffset currentTime =
			new(2026, 1, 30, 10, 0, 0, TimeSpan.Zero);

		TimeOnly preferredTimeUtc =
			new(8, 10);

		// Act
		DateTimeOffset result =
			RecurringJobService.CalculateNextPreferredTime(
				currentTime,
				preferredTimeUtc);

		// Assert
		result.ShouldBe(new DateTimeOffset(2026, 1, 31, 8, 10, 0, TimeSpan.Zero));
	}

	/// <summary>
	/// CalculateNextPreferredTime returns next day when exactly at preferred time.
	/// </summary>
	[Fact]
	public void CalculateNextPreferredTime_ExactlyAtPreferredTime_ReturnsNextDay()
	{
		// Arrange - 8:10 AM UTC, preferred time is 8:10 UTC
		DateTimeOffset currentTime =
			new(2026, 1, 30, 8, 10, 0, TimeSpan.Zero);

		TimeOnly preferredTimeUtc =
			new(8, 10);

		// Act
		DateTimeOffset result =
			RecurringJobService.CalculateNextPreferredTime(
				currentTime,
				preferredTimeUtc);

		// Assert - time has passed, schedule for tomorrow
		result.ShouldBe(new DateTimeOffset(2026, 1, 31, 8, 10, 0, TimeSpan.Zero));
	}

	/// <summary>
	/// When computed next time is in the past, RecordAndScheduleNextAsync should
	/// advance to the next interval boundary rather than firing immediately.
	/// </summary>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	[Fact]
	public async Task RecordAndScheduleNextAsync_WhenComputedTimeInPast_AdvancesToNextIntervalAsync()
	{
		// Arrange - executed 15 seconds ago, interval is 10 seconds
		// Computed next = 15s ago + 10s = 5 seconds ago (IN THE PAST)
		// AdvanceToNextInterval with 30s buffer: threshold = now+30s
		// elapsed = (now+30s) - (now-15s) = 45s
		// periods = 45s / 10s + 1 = 5
		// Next = executedAt + 50s = now + 35s (≥30s margin ✓)
		DateTimeOffset now =
			TimeProvider.GetUtcNow();

		DateTimeOffset executedAt =
			now.AddSeconds(-15);

		TimeSpan interval =
			TimeSpan.FromSeconds(10);

		// Act
		await Service.RecordAndScheduleNextAsync<TestJob>(
			"TestJob",
			executedAt,
			interval,
			CancellationToken.None);

		// Assert - advanced to next interval boundary (executedAt + 50s = now + 35s)
		DateTimeOffset expectedNextRun =
			executedAt.AddSeconds(50);

		expectedNextRun.ShouldBeGreaterThan(now);

		await Repository
			.Received(1)
			.UpsertExecutionAsync(
				Arg.Is<RecurringJobExecution>(execution =>
					execution.JobName == "TestJob"
					&& execution.LastExecutedAt == executedAt
					&& execution.NextScheduledAt == expectedNextRun),
				Arg.Any<CancellationToken>());

		await Scheduler
			.Received(1)
			.ScheduleAsync(
				Arg.Any<TestJob>(),
				expectedNextRun,
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// AdvanceToNextInterval skips exactly enough periods to land after now.
	/// </summary>
	[Theory]
	[InlineData(-3, 1, 1)]
	[InlineData(-2.5, 1, 0.5)]
	[InlineData(-7, 3, 2)]
	public void AdvanceToNextInterval_ReturnsNextIntervalBoundaryAfterNow(
		double elapsedDays,
		double intervalDays,
		double expectedFutureDays)
	{
		// Arrange
		DateTimeOffset now =
			TimeProvider.GetUtcNow();

		DateTimeOffset baseTime =
			now.AddDays(elapsedDays);

		TimeSpan interval =
			TimeSpan.FromDays(intervalDays);

		// Act
		DateTimeOffset result =
			RecurringJobService.AdvanceToNextInterval(
				baseTime,
				interval,
				now);

		// Assert
		DateTimeOffset expected =
			now.AddDays(expectedFutureDays);

		result.ShouldBe(expected);
		result.ShouldBeGreaterThan(now);
	}

	/// <summary>
	/// When LastExecutedAt is MinValue (startup upsert, never actually ran),
	/// treat identically to null — schedule one full interval from now.
	/// </summary>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	[Fact]
	public async Task EnsureScheduledAsync_WhenLastExecutedAtIsMinValue_SchedulesOneIntervalFromNowAsync()
	{
		// Arrange — simulates restart where job was registered but never ran
		DateTimeOffset now =
			TimeProvider.GetUtcNow();

		TimeSpan interval =
			TimeSpan.FromSeconds(30);

		Repository
			.GetLastExecutionAsync(
				"TestJob",
				Arg.Any<CancellationToken>())
			.Returns(new RecurringJobExecution
			{
				JobName = "TestJob",
				LastExecutedAt = DateTimeOffset.MinValue,
				NextScheduledAt = now.AddDays(-1),
				LastExecutedBy = "Not yet run"
			});

		// Act
		await Service.EnsureScheduledAsync<TestJob>(
			"TestJob",
			interval,
			CancellationToken.None);

		// Assert — treated as never-executed, schedules one full interval from now
		DateTimeOffset expectedNextRun =
			now.Add(interval);

		await Scheduler
			.Received(1)
			.ScheduleAsync(
				Arg.Any<TestJob>(),
				expectedNextRun,
				Arg.Any<CancellationToken>());

		await Repository
			.Received(1)
			.UpsertExecutionAsync(
				Arg.Is<RecurringJobExecution>(execution =>
					execution.JobName == "TestJob"
					&& execution.LastExecutedAt == DateTimeOffset.MinValue
					&& execution.NextScheduledAt == expectedNextRun
					&& execution.LastExecutedBy == "Not yet run"),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// AdvanceToNextInterval with short intervals must guarantee at least
	/// 30 seconds of margin while staying interval-aligned.
	/// </summary>
	[Fact]
	public void AdvanceToNextInterval_WithShortInterval_GuaranteesThirtySecondMargin()
	{
		// Arrange — base time is 10 seconds ago, interval is 10 seconds
		// Without buffer: result = now + 10s (only 10s margin — too tight)
		// With buffer: threshold = now+30s, result = now + 40s (40s margin ✓)
		DateTimeOffset now =
			TimeProvider.GetUtcNow();

		DateTimeOffset baseTime =
			now.AddSeconds(-10);

		TimeSpan interval =
			TimeSpan.FromSeconds(10);

		// Act
		DateTimeOffset result =
			RecurringJobService.AdvanceToNextInterval(
				baseTime,
				interval,
				now);

		// Assert — must be at least 30 seconds in the future
		result.ShouldBeGreaterThanOrEqualTo(now.AddSeconds(30));

		// Assert — must be interval-aligned from baseTime
		TimeSpan fromBase =
			result - baseTime;

		(fromBase.Ticks % interval.Ticks).ShouldBe(0);
	}

	/// <summary>
	/// On restart, if NextScheduledAt is already in the future (with 30s margin),
	/// preserve the existing schedule and re-send the Wolverine message.
	/// </summary>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	[Fact]
	public async Task EnsureScheduledAtPreferredTimeAsync_WhenNextScheduledAtIsInFuture_PreservesExistingScheduleAsync()
	{
		// Arrange — job ran 2 days ago, NextScheduledAt = 5 days from now
		DateTimeOffset now =
			TimeProvider.GetUtcNow();

		DateTimeOffset nextMonday =
			now.AddDays(5);

		Repository
			.GetLastExecutionAsync(
				"TestJob",
				Arg.Any<CancellationToken>())
			.Returns(new RecurringJobExecution
			{
				JobName = "TestJob",
				LastExecutedAt = now.AddDays(-2),
				NextScheduledAt = nextMonday,
				LastExecutedBy = Environment.MachineName
			});

		// Act
		await Service.EnsureScheduledAtPreferredTimeAsync<TestJob>(
			"TestJob",
			new TimeOnly(3, 0),
			TimeSpan.FromDays(7),
			CancellationToken.None);

		// Assert — scheduled at the EXISTING future time, NOT the next preferred time
		await Scheduler
			.Received(1)
			.ScheduleAsync(
				Arg.Any<TestJob>(),
				nextMonday,
				Arg.Any<CancellationToken>());

		// Assert — DB NOT updated (no UpsertExecutionAsync call)
		await Repository
			.DidNotReceive()
			.UpsertExecutionAsync(
				Arg.Any<RecurringJobExecution>(),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// On restart with an overdue NextScheduledAt, compute a fresh preferred time
	/// and update the DB.
	/// </summary>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	[Fact]
	public async Task EnsureScheduledAtPreferredTimeAsync_WhenNextScheduledAtIsInPast_ComputesNewPreferredTimeAsync()
	{
		// Arrange — job is overdue, NextScheduledAt is 2 days ago
		DateTimeOffset now =
			TimeProvider.GetUtcNow();

		TimeOnly preferredTimeUtc =
			new(3, 0);

		Repository
			.GetLastExecutionAsync(
				"TestJob",
				Arg.Any<CancellationToken>())
			.Returns(new RecurringJobExecution
			{
				JobName = "TestJob",
				LastExecutedAt = now.AddDays(-9),
				NextScheduledAt = now.AddDays(-2),
				LastExecutedBy = Environment.MachineName
			});

		// Act
		await Service.EnsureScheduledAtPreferredTimeAsync<TestJob>(
			"TestJob",
			preferredTimeUtc,
			TimeSpan.FromDays(7),
			CancellationToken.None);

		// Assert — computed new preferred time (not the stale one)
		DateTimeOffset expectedNextRun =
			RecurringJobService.CalculateNextPreferredTime(
				now,
				preferredTimeUtc);

		await Scheduler
			.Received(1)
			.ScheduleAsync(
				Arg.Any<TestJob>(),
				expectedNextRun,
				Arg.Any<CancellationToken>());

		// Assert — DB updated with new NextScheduledAt
		await Repository
			.Received(1)
			.UpsertExecutionAsync(
				Arg.Is<RecurringJobExecution>(execution =>
					execution.NextScheduledAt == expectedNextRun),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Test job marker record for unit tests.
	/// </summary>
	private record TestJob;
}