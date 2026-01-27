// <copyright file="RecurringJobServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Shared.BackgroundJobs;
using Shouldly;

namespace SeventySix.Shared.Tests.BackgroundJobs;

/// <summary>
/// Unit tests for <see cref="RecurringJobService"/>.
/// </summary>
public class RecurringJobServiceTests
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
			new FakeTimeProvider(new DateTimeOffset(2026, 1, 7, 12, 0, 0, TimeSpan.Zero));

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
	/// When a job has never been executed, it should be scheduled immediately.
	/// </summary>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	[Fact]
	public async Task EnsureScheduledAsync_WhenNeverExecuted_SchedulesImmediatelyAsync()
	{
		// Arrange
		Repository
			.GetLastExecutionAsync(
				Arg.Any<string>(),
				Arg.Any<CancellationToken>())
			.Returns((RecurringJobExecution?)null);

		// Act
		await Service.EnsureScheduledAsync<TestJob>(
			"TestJob",
			TimeSpan.FromHours(24),
			CancellationToken.None);

		// Assert - schedules 1 second in the future to avoid race conditions
		await Scheduler
			.Received(1)
			.ScheduleAsync(
				Arg.Any<TestJob>(),
				TimeProvider.GetUtcNow().AddSeconds(1),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// When a job is overdue, it should be scheduled immediately.
	/// </summary>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	[Fact]
	public async Task EnsureScheduledAsync_WhenOverdue_SchedulesImmediatelyAsync()
	{
		// Arrange - last execution 2 days ago, interval is 1 day
		DateTimeOffset lastExecuted =
			TimeProvider.GetUtcNow().AddDays(-2);

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
			TimeSpan.FromDays(1),
			CancellationToken.None);

		// Assert - schedules 1 second in the future since it's overdue (avoids race conditions)
		await Scheduler
			.Received(1)
			.ScheduleAsync(
				Arg.Any<TestJob>(),
				TimeProvider.GetUtcNow().AddSeconds(1),
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
	/// Test job marker record for unit tests.
	/// </summary>
	private record TestJob;
}