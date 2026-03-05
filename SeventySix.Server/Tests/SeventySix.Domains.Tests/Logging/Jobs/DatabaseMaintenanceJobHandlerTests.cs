// <copyright file="DatabaseMaintenanceJobHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using SeventySix.Logging;
using SeventySix.Logging.Jobs;
using SeventySix.Shared.BackgroundJobs;
using SeventySix.TestUtilities.Constants;
using Shouldly;

namespace SeventySix.Domains.Tests.Logging.Jobs;

/// <summary>
/// Unit tests for <see cref="DatabaseMaintenanceJobHandler"/>.
/// Focus: Scheduling logic and enabled/disabled behavior (80/20 rule).
/// Database VACUUM operations are PostgreSQL's responsibility.
/// </summary>
public sealed class DatabaseMaintenanceJobHandlerTests
{
	private readonly IDatabaseMaintenanceService DatabaseMaintenanceService;
	private readonly IRecurringJobService RecurringJobService;
	private readonly IOptions<DatabaseMaintenanceSettings> Settings;
	private readonly FakeTimeProvider TimeProvider;
	private readonly DatabaseMaintenanceJobHandler Handler;

	/// <summary>
	/// Initializes a new instance of the <see cref="DatabaseMaintenanceJobHandlerTests"/> class.
	/// </summary>
	public DatabaseMaintenanceJobHandlerTests()
	{
		TimeProvider =
			TestDates.CreateFutureTimeProvider();

		DatabaseMaintenanceService =
			Substitute.For<IDatabaseMaintenanceService>();

		RecurringJobService =
			Substitute.For<IRecurringJobService>();

		Settings =
			Options.Create(new DatabaseMaintenanceSettings
			{
				Enabled = true,
				IntervalHours = 24
			});

		Handler =
			new DatabaseMaintenanceJobHandler(
				DatabaseMaintenanceService,
				RecurringJobService,
				Settings,
				TimeProvider,
				NullLogger<DatabaseMaintenanceJobHandler>.Instance);
	}

	/// <summary>
	/// Verifies handler skips work when disabled but still reschedules.
	/// </summary>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	[Fact]
	public async Task HandleAsync_WhenDisabled_SkipsWorkButReschedulesAsync()
	{
		// Arrange
		IOptions<DatabaseMaintenanceSettings> disabledSettings =
			Options.Create(new DatabaseMaintenanceSettings
			{
				Enabled = false,
				IntervalHours = 24
			});

		DatabaseMaintenanceJobHandler disabledHandler =
			new(
				DatabaseMaintenanceService,
				RecurringJobService,
				disabledSettings,
				TimeProvider,
				NullLogger<DatabaseMaintenanceJobHandler>.Instance);

		// Act
		await disabledHandler.HandleAsync(
			new DatabaseMaintenanceJob(),
			CancellationToken.None);

		// Assert - Work should be skipped
		await DatabaseMaintenanceService
			.DidNotReceive()
			.ExecuteVacuumAnalyzeAsync(Arg.Any<CancellationToken>());

		// Assert - Rescheduling should still occur
		await RecurringJobService
			.Received(1)
			.RecordAndScheduleNextAsync<DatabaseMaintenanceJob>(
				Arg.Any<string>(),
				Arg.Any<DateTimeOffset>(),
				Arg.Any<TimeSpan>(),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Verifies correct interval is used for scheduling next run.
	/// </summary>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	[Fact]
	public async Task HandleAsync_WhenEnabled_SchedulesNextRunWithCorrectIntervalAsync()
	{
		// Act
		await Handler.HandleAsync(
			new DatabaseMaintenanceJob(),
			CancellationToken.None);

		// Assert
		await RecurringJobService
			.Received(1)
			.RecordAndScheduleNextAsync<DatabaseMaintenanceJob>(
				nameof(DatabaseMaintenanceJob),
				TimeProvider.GetUtcNow(),
				TimeSpan.FromHours(24),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Verifies custom interval from settings is respected.
	/// </summary>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	[Fact]
	public async Task HandleAsync_UsesCustomIntervalFromSettingsAsync()
	{
		// Arrange
		IOptions<DatabaseMaintenanceSettings> customSettings =
			Options.Create(new DatabaseMaintenanceSettings
			{
				Enabled = true,
				IntervalHours = 12
			});

		DatabaseMaintenanceJobHandler customHandler =
			new(
				DatabaseMaintenanceService,
				RecurringJobService,
				customSettings,
				TimeProvider,
				NullLogger<DatabaseMaintenanceJobHandler>.Instance);

		// Act
		await customHandler.HandleAsync(
			new DatabaseMaintenanceJob(),
			CancellationToken.None);

		// Assert
		await RecurringJobService
			.Received(1)
			.RecordAndScheduleNextAsync<DatabaseMaintenanceJob>(
				nameof(DatabaseMaintenanceJob),
				TimeProvider.GetUtcNow(),
				TimeSpan.FromHours(12),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Verifies maintenance service is called when enabled.
	/// </summary>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	[Fact]
	public async Task HandleAsync_WhenEnabled_ExecutesVacuumAnalyzeAsync()
	{
		// Act
		await Handler.HandleAsync(
			new DatabaseMaintenanceJob(),
			CancellationToken.None);

		// Assert
		await DatabaseMaintenanceService
			.Received(1)
			.ExecuteVacuumAnalyzeAsync(Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Verifies that service exceptions are caught and rescheduling still occurs.
	/// </summary>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	[Fact]
	public async Task HandleAsync_WhenServiceThrows_CatchesExceptionAndReschedulesAsync()
	{
		// Arrange
		InvalidOperationException expectedException =
			new("VACUUM failed - database locked");

		DatabaseMaintenanceService
			.ExecuteVacuumAnalyzeAsync(Arg.Any<CancellationToken>())
			.ThrowsAsync(expectedException);

		// Act — should NOT throw
		await Handler.HandleAsync(
			new DatabaseMaintenanceJob(),
			CancellationToken.None);

		// Assert — rescheduling STILL occurred despite exception
		await RecurringJobService
			.Received(1)
			.RecordAndScheduleNextAsync<DatabaseMaintenanceJob>(
				Arg.Any<string>(),
				Arg.Any<DateTimeOffset>(),
				Arg.Any<TimeSpan>(),
				Arg.Any<CancellationToken>());
	}
}