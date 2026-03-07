// <copyright file="LogCleanupJobHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using SeventySix.Logging;
using SeventySix.Logging.Jobs;
using SeventySix.Shared.BackgroundJobs;
using SeventySix.TestUtilities.Constants;

namespace SeventySix.Domains.Tests.Logging.Jobs;

/// <summary>
/// Unit tests for <see cref="LogCleanupJobHandler"/>.
/// Focus: Scheduling logic verification. Database operations tested via LogRepositoryTests.
/// </summary>
public sealed class LogCleanupJobHandlerTests
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
			TestDates.CreateFutureTimeProvider();

		LogRepository =
			Substitute.For<ILogRepository>();

		RecurringJobService =
			Substitute.For<IRecurringJobService>();

		Settings =
			Options.Create(new LogCleanupSettings
			{
				Enabled = true,
				IntervalHours = 24,
				RetentionDays = 30,
				LogDirectory = "non-existent-test-directory",
				LogFilePattern = "*.nonexistent"
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
		DateTimeOffset expectedCutoff =
			TimeProvider.GetUtcNow().AddDays(-30);

		// Act
		await Handler.HandleAsync(
			new LogCleanupJob(),
			CancellationToken.None);

		// Assert
		await LogRepository
			.Received(1)
			.DeleteOlderThanAsync(
				Arg.Is<DateTimeOffset>(
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
				Enabled = true,
				IntervalHours = 48,
				RetentionDays = 60,
				LogDirectory = "non-existent-test-directory",
				LogFilePattern = "*.nonexistent"
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
	/// Verifies no cleanup when disabled but rescheduling still occurs.
	/// </summary>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	[Fact]
	public async Task HandleAsync_WhenDisabled_SkipsWorkButReschedulesAsync()
	{
		// Arrange
		IOptions<LogCleanupSettings> disabledSettings =
			Options.Create(new LogCleanupSettings
			{
				Enabled = false,
				IntervalHours = 24
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

		// Assert - Work should be skipped
		await LogRepository
			.DidNotReceive()
			.DeleteOlderThanAsync(
				Arg.Any<DateTimeOffset>(),
				Arg.Any<CancellationToken>());

		// Assert - Rescheduling should still occur
		await RecurringJobService
			.Received(1)
			.RecordAndScheduleNextAsync<LogCleanupJob>(
				Arg.Any<string>(),
				Arg.Any<DateTimeOffset>(),
				Arg.Any<TimeSpan>(),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Verifies that repository exceptions are caught and rescheduling still occurs.
	/// </summary>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	[Fact]
	public async Task HandleAsync_WhenRepositoryThrows_CatchesExceptionAndReschedulesAsync()
	{
		// Arrange
		InvalidOperationException expectedException =
			new("Database connection lost");

		LogRepository
			.DeleteOlderThanAsync(
				Arg.Any<DateTimeOffset>(),
				Arg.Any<CancellationToken>())
			.ThrowsAsync(expectedException);

		// Act — should NOT throw
		await Handler.HandleAsync(
			new LogCleanupJob(),
			CancellationToken.None);

		// Assert — rescheduling STILL occurred despite exception
		await RecurringJobService
			.Received(1)
			.RecordAndScheduleNextAsync<LogCleanupJob>(
				Arg.Any<string>(),
				Arg.Any<DateTimeOffset>(),
				Arg.Any<TimeSpan>(),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Verifies that an exception type NOT handled by the inner catch (e.g., HttpRequestException)
	/// is caught by the outer try/catch and rescheduling still occurs.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UncaughtExceptionDuringWork_StillReschedulesNextRunAsync()
	{
		// Arrange
		LogRepository
			.DeleteOlderThanAsync(
				Arg.Any<DateTimeOffset>(),
				Arg.Any<CancellationToken>())
			.ThrowsAsync(new HttpRequestException("Transient failure"));

		// Act — should NOT throw
		await Handler.HandleAsync(
			new LogCleanupJob(),
			CancellationToken.None);

		// Assert — rescheduling STILL occurred despite uncaught exception type
		await RecurringJobService
			.Received(1)
			.RecordAndScheduleNextAsync<LogCleanupJob>(
				Arg.Any<string>(),
				Arg.Any<DateTimeOffset>(),
				Arg.Any<TimeSpan>(),
				Arg.Any<CancellationToken>());
	}
}