// <copyright file="LogCleanupJobHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Logging;
using SeventySix.Logging.Jobs;
using SeventySix.Shared.BackgroundJobs;
using Shouldly;

namespace SeventySix.Domains.Tests.Logging.Jobs;

/// <summary>
/// Unit tests for <see cref="LogCleanupJobHandler"/>.
/// Focus: Scheduling logic verification. Database operations tested via LogRepositoryTests.
/// </summary>
public class LogCleanupJobHandlerTests
{
	private readonly ILogRepository LogRepository;
	private readonly IRecurringJobService RecurringJobService;
	private readonly IOptions<LogCleanupSettings> Settings;
	private readonly FakeTimeProvider TimeProvider;
	private readonly LogCleanupJobHandler Handler;

	/// <summary>
	/// Initializes a new instance of the <see cref="LogCleanupJobHandlerTests"/> class.
	/// </summary>
	public LogCleanupJobHandlerTests()
	{
		TimeProvider =
			new FakeTimeProvider(new DateTimeOffset(2026, 1, 7, 12, 0, 0, TimeSpan.Zero));

		LogRepository =
			Substitute.For<ILogRepository>();

		RecurringJobService =
			Substitute.For<IRecurringJobService>();

		Settings =
			Options.Create(new LogCleanupSettings
			{
				IntervalHours = 24,
				RetentionDays = 30
			});

		Handler =
			new LogCleanupJobHandler(
				LogRepository,
				RecurringJobService,
				Settings,
				TimeProvider,
				NullLogger<LogCleanupJobHandler>.Instance);
	}

	/// <summary>
	/// Verifies correct interval is used for scheduling next run.
	/// </summary>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	[Fact]
	public async Task HandleAsync_SchedulesNextRunWithCorrectIntervalAsync()
	{
		// Act
		await Handler.HandleAsync(
			new LogCleanupJob(),
			CancellationToken.None);

		// Assert
		await RecurringJobService
			.Received(1)
			.RecordAndScheduleNextAsync<LogCleanupJob>(
				nameof(LogCleanupJob),
				TimeProvider.GetUtcNow(),
				TimeSpan.FromHours(24),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Verifies repository is called with correct cutoff date.
	/// </summary>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	[Fact]
	public async Task HandleAsync_CallsRepositoryWithCorrectCutoffDateAsync()
	{
		// Arrange
		DateTime expectedCutoff =
			TimeProvider.GetUtcNow().AddDays(-30).UtcDateTime;

		// Act
		await Handler.HandleAsync(
			new LogCleanupJob(),
			CancellationToken.None);

		// Assert
		await LogRepository
			.Received(1)
			.DeleteOlderThanAsync(
				Arg.Is<DateTime>(
					date => Math.Abs((date - expectedCutoff).TotalSeconds) < 1),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Verifies custom interval from settings is used.
	/// </summary>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	[Fact]
	public async Task HandleAsync_UsesCustomIntervalFromSettingsAsync()
	{
		// Arrange
		IOptions<LogCleanupSettings> customSettings =
			Options.Create(new LogCleanupSettings
			{
				IntervalHours = 48,
				RetentionDays = 60
			});

		LogCleanupJobHandler customHandler =
			new(
				LogRepository,
				RecurringJobService,
				customSettings,
				TimeProvider,
				NullLogger<LogCleanupJobHandler>.Instance);

		// Act
		await customHandler.HandleAsync(
			new LogCleanupJob(),
			CancellationToken.None);

		// Assert
		await RecurringJobService
			.Received(1)
			.RecordAndScheduleNextAsync<LogCleanupJob>(
				nameof(LogCleanupJob),
				TimeProvider.GetUtcNow(),
				TimeSpan.FromHours(48),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Verifies no cleanup when disabled.
	/// </summary>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	[Fact]
	public async Task HandleAsync_SkipsCleanupWhenDisabledAsync()
	{
		// Arrange
		IOptions<LogCleanupSettings> disabledSettings =
			Options.Create(new LogCleanupSettings
			{
				Enabled = false
			});

		LogCleanupJobHandler disabledHandler =
			new(
				LogRepository,
				RecurringJobService,
				disabledSettings,
				TimeProvider,
				NullLogger<LogCleanupJobHandler>.Instance);

		// Act
		await disabledHandler.HandleAsync(
			new LogCleanupJob(),
			CancellationToken.None);

		// Assert - Neither repository nor scheduler should be called
		await LogRepository
			.DidNotReceive()
			.DeleteOlderThanAsync(
				Arg.Any<DateTime>(),
				Arg.Any<CancellationToken>());

		await RecurringJobService
			.DidNotReceive()
			.RecordAndScheduleNextAsync<LogCleanupJob>(
				Arg.Any<string>(),
				Arg.Any<DateTimeOffset>(),
				Arg.Any<TimeSpan>(),
				Arg.Any<CancellationToken>());
	}
}
