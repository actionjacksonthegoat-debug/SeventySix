// <copyright file="EmailQueueRetentionJobHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.ElectronicNotifications;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.ElectronicNotifications.Emails.Jobs;
using SeventySix.Shared.BackgroundJobs;
using SeventySix.TestUtilities.Constants;

namespace SeventySix.Domains.Tests.ElectronicNotifications.Emails.Jobs;

/// <summary>
/// Unit tests for <see cref="EmailQueueRetentionJobHandler"/>.
/// Focus: Scheduling logic and disabled-state behavior.
/// Database delete operations (ExecuteDeleteAsync) require relational provider
/// and are covered by integration/E2E tests.
/// </summary>
public sealed class EmailQueueRetentionJobHandlerTests : IDisposable
{
	private readonly ElectronicNotificationsDbContext DbContext;
	private readonly IRecurringJobService RecurringJobService;
	private readonly FakeTimeProvider TimeProvider;

	/// <summary>
	/// Initializes a new instance of the <see cref="EmailQueueRetentionJobHandlerTests"/> class.
	/// </summary>
	public EmailQueueRetentionJobHandlerTests()
	{
		TimeProvider =
			TestDates.CreateFutureTimeProvider();

		DbContextOptions<ElectronicNotificationsDbContext> options =
			new DbContextOptionsBuilder<ElectronicNotificationsDbContext>()
				.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
				.Options;

		DbContext =
			new ElectronicNotificationsDbContext(options);

		RecurringJobService =
			Substitute.For<IRecurringJobService>();
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
		// Arrange
		EmailQueueRetentionJobHandler handler =
			CreateHandler(enabled: false, intervalHours: 24);

		// Act
		await handler.HandleAsync(
			new EmailQueueRetentionJob(),
			CancellationToken.None);

		// Assert
		await RecurringJobService
			.Received(1)
			.RecordAndScheduleNextAnchoredAsync<EmailQueueRetentionJob>(
				nameof(EmailQueueRetentionJob),
				TimeProvider.GetUtcNow(),
				Arg.Any<TimeOnly>(),
				TimeSpan.FromHours(24),
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
		EmailQueueRetentionJobHandler handler =
			CreateHandler(enabled: false);

		// Act
		await handler.HandleAsync(
			new EmailQueueRetentionJob(),
			CancellationToken.None);

		// Assert — rescheduling should still occur
		await RecurringJobService
			.Received(1)
			.RecordAndScheduleNextAnchoredAsync<EmailQueueRetentionJob>(
				Arg.Any<string>(),
				Arg.Any<DateTimeOffset>(),
				Arg.Any<TimeOnly>(),
				Arg.Any<TimeSpan>(),
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
		EmailQueueRetentionJobHandler handler =
			CreateHandler(enabled: false, intervalHours: 48);

		// Act
		await handler.HandleAsync(
			new EmailQueueRetentionJob(),
			CancellationToken.None);

		// Assert
		await RecurringJobService
			.Received(1)
			.RecordAndScheduleNextAnchoredAsync<EmailQueueRetentionJob>(
				nameof(EmailQueueRetentionJob),
				TimeProvider.GetUtcNow(),
				Arg.Any<TimeOnly>(),
				TimeSpan.FromHours(48),
				Arg.Any<CancellationToken>());
	}

	/// <inheritdoc />
	public void Dispose()
	{
		DbContext.Dispose();
	}

	/// <summary>
	/// Creates a handler with specified settings.
	/// </summary>
	/// <param name="enabled">
	/// Whether retention is enabled.
	/// </param>
	/// <param name="intervalHours">
	/// The cleanup interval in hours.
	/// </param>
	/// <param name="retentionDays">
	/// The retention period in days.
	/// </param>
	/// <returns>
	/// A configured handler instance.
	/// </returns>
	private EmailQueueRetentionJobHandler CreateHandler(
		bool enabled,
		int intervalHours = 24,
		int retentionDays = 14)
	{
		IOptions<EmailQueueRetentionSettings> settings =
			Options.Create(new EmailQueueRetentionSettings
			{
				Enabled = enabled,
				IntervalHours = intervalHours,
				RetentionDays = retentionDays,
				PreferredStartHourUtc = 8,
				PreferredStartMinuteUtc = 30
			});

		return new EmailQueueRetentionJobHandler(
			DbContext,
			RecurringJobService,
			settings,
			TimeProvider,
			NullLogger<EmailQueueRetentionJobHandler>.Instance);
	}
}