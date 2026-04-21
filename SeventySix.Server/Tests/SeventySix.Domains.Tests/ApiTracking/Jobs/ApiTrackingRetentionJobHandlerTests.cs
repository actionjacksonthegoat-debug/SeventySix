// <copyright file="ApiTrackingRetentionJobHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using SeventySix.ApiTracking;
using SeventySix.ApiTracking.Jobs;
using SeventySix.Shared.BackgroundJobs;
using SeventySix.TestUtilities.Constants;

namespace SeventySix.Domains.Tests.ApiTracking.Jobs;

/// <summary>
/// Unit tests for <see cref="ApiTrackingRetentionJobHandler"/>.
/// Focus: Scheduling logic and cutoff date calculation.
/// </summary>
public sealed class ApiTrackingRetentionJobHandlerTests
{
	private readonly IThirdPartyApiRequestRepository Repository;
	private readonly IRecurringJobService RecurringJobService;
	private readonly IOptions<ApiTrackingRetentionSettings> Settings;
	private readonly FakeTimeProvider TimeProvider;
	private readonly ApiTrackingRetentionJobHandler Handler;

	/// <summary>
	/// Initializes a new instance of the <see cref="ApiTrackingRetentionJobHandlerTests"/> class.
	/// </summary>
	public ApiTrackingRetentionJobHandlerTests()
	{
		TimeProvider =
			TestDates.CreateFutureTimeProvider();

		Repository =
			Substitute.For<IThirdPartyApiRequestRepository>();

		RecurringJobService =
			Substitute.For<IRecurringJobService>();

		Settings =
			Options.Create(new ApiTrackingRetentionSettings
			{
				Enabled = true,
				IntervalHours = 24,
				RetentionDays = 90,
				PreferredStartHourUtc = 8,
				PreferredStartMinuteUtc = 40
			});

		Handler =
			new ApiTrackingRetentionJobHandler(
				Repository,
				RecurringJobService,
				Settings,
				TimeProvider,
				NullLogger<ApiTrackingRetentionJobHandler>.Instance);
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
			new ApiTrackingRetentionJob(),
			CancellationToken.None);

		// Assert
		await RecurringJobService
			.Received(1)
			.RecordAndScheduleNextAnchoredAsync<ApiTrackingRetentionJob>(
				nameof(ApiTrackingRetentionJob),
				TimeProvider.GetUtcNow(),
				Arg.Any<TimeOnly>(),
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
		DateOnly expectedCutoff =
			DateOnly.FromDateTime(
				TimeProvider.GetUtcNow().AddDays(-90).DateTime);

		// Act
		await Handler.HandleAsync(
			new ApiTrackingRetentionJob(),
			CancellationToken.None);

		// Assert
		await Repository
			.Received(1)
			.DeleteOlderThanAsync(
				expectedCutoff,
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
		IOptions<ApiTrackingRetentionSettings> disabledSettings =
			Options.Create(new ApiTrackingRetentionSettings
			{
				Enabled = false,
				IntervalHours = 24
			});

		ApiTrackingRetentionJobHandler disabledHandler =
			new(
				Repository,
				RecurringJobService,
				disabledSettings,
				TimeProvider,
				NullLogger<ApiTrackingRetentionJobHandler>.Instance);

		// Act
		await disabledHandler.HandleAsync(
			new ApiTrackingRetentionJob(),
			CancellationToken.None);

		// Assert - Work should be skipped
		await Repository
			.DidNotReceive()
			.DeleteOlderThanAsync(
				Arg.Any<DateOnly>(),
				Arg.Any<CancellationToken>());

		// Assert - Rescheduling should still occur
		await RecurringJobService
			.Received(1)
			.RecordAndScheduleNextAnchoredAsync<ApiTrackingRetentionJob>(
				Arg.Any<string>(),
				Arg.Any<DateTimeOffset>(),
				Arg.Any<TimeOnly>(),
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
		Repository
			.DeleteOlderThanAsync(
				Arg.Any<DateOnly>(),
				Arg.Any<CancellationToken>())
			.ThrowsAsync(new InvalidOperationException("Database connection lost"));

		// Act — should NOT throw
		await Handler.HandleAsync(
			new ApiTrackingRetentionJob(),
			CancellationToken.None);

		// Assert — rescheduling STILL occurred despite exception
		await RecurringJobService
			.Received(1)
			.RecordAndScheduleNextAnchoredAsync<ApiTrackingRetentionJob>(
				Arg.Any<string>(),
				Arg.Any<DateTimeOffset>(),
				Arg.Any<TimeOnly>(),
				Arg.Any<TimeSpan>(),
				Arg.Any<CancellationToken>());
	}
}