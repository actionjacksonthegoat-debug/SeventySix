// <copyright file="ScheduledJobServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Api.Infrastructure;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.Identity.Settings;
using SeventySix.Logging;
using SeventySix.Shared.BackgroundJobs;
using SeventySix.Shared.Constants;
using SeventySix.TestUtilities.Constants;
using Shouldly;

namespace SeventySix.Api.Tests.Infrastructure.Services;

/// <summary>
/// Unit tests for ScheduledJobService.
/// </summary>
public class ScheduledJobServiceTests
{
	private readonly IRecurringJobRepository RecurringJobRepository;
	private readonly IOptions<RefreshTokenCleanupSettings> RefreshTokenCleanupSettingsOption;
	private readonly IOptions<IpAnonymizationSettings> IpAnonymizationSettingsOption;
	private readonly IOptions<LogCleanupSettings> LogCleanupSettingsOption;
	private readonly IOptions<EmailQueueSettings> EmailQueueSettingsOption;
	private readonly IOptions<OrphanedRegistrationCleanupSettings> OrphanedRegistrationCleanupSettingsOption;
	private readonly IOptions<DatabaseMaintenanceSettings> DatabaseMaintenanceSettingsOption;
	private readonly FakeTimeProvider TimeProviderFake;

	public ScheduledJobServiceTests()
	{
		RecurringJobRepository =
			Substitute.For<IRecurringJobRepository>();

		RefreshTokenCleanupSettingsOption =
			Options.Create(
				new RefreshTokenCleanupSettings { IntervalHours = 24 });

		IpAnonymizationSettingsOption =
			Options.Create(
				new IpAnonymizationSettings { IntervalDays = 7 });

		LogCleanupSettingsOption =
			Options.Create(
				new LogCleanupSettings { IntervalHours = 24 });

		EmailQueueSettingsOption =
			Options.Create(
				new EmailQueueSettings { ProcessingIntervalSeconds = 30 });

		OrphanedRegistrationCleanupSettingsOption =
			Options.Create(
				new OrphanedRegistrationCleanupSettings { IntervalHours = 24 });

		DatabaseMaintenanceSettingsOption =
			Options.Create(
				new DatabaseMaintenanceSettings { IntervalHours = 24 });

		TimeProviderFake =
			TestDates.CreateHistoricalTimeProvider();
	}

	private ScheduledJobService CreateSut()
	{
		return new ScheduledJobService(
			RecurringJobRepository,
			RefreshTokenCleanupSettingsOption,
			IpAnonymizationSettingsOption,
			LogCleanupSettingsOption,
			EmailQueueSettingsOption,
			OrphanedRegistrationCleanupSettingsOption,
			DatabaseMaintenanceSettingsOption,
			TimeProviderFake);
	}

	[Fact]
	public async Task GetAllJobStatusesAsync_ReturnsAllSixJobsAsync()
	{
		// Arrange
		RecurringJobRepository
			.GetAllAsync(Arg.Any<CancellationToken>())
			.Returns([]);

		ScheduledJobService service =
			CreateSut();

		// Act
		IReadOnlyList<RecurringJobStatusResponse> result =
			await service.GetAllJobStatusesAsync(CancellationToken.None);

		// Assert
		result.Count.ShouldBe(6);
		result.ShouldContain(
			job => job.JobName == "RefreshTokenCleanupJob");
		result.ShouldContain(
			job => job.JobName == "IpAnonymizationJob");
		result.ShouldContain(
			job => job.JobName == "LogCleanupJob");
		result.ShouldContain(
			job => job.JobName == "EmailQueueProcessJob");
		result.ShouldContain(
			job => job.JobName == "OrphanedRegistrationCleanupJob");
		result.ShouldContain(
			job => job.JobName == "DatabaseMaintenanceJob");
	}

	[Fact]
	public async Task GetAllJobStatusesAsync_ReturnsUnknownStatus_WhenJobNeverExecutedAsync()
	{
		// Arrange
		RecurringJobRepository
			.GetAllAsync(Arg.Any<CancellationToken>())
			.Returns([]);

		ScheduledJobService service =
			CreateSut();

		// Act
		IReadOnlyList<RecurringJobStatusResponse> result =
			await service.GetAllJobStatusesAsync(CancellationToken.None);

		// Assert
		result.ShouldAllBe(
			job => job.Status == HealthStatusConstants.Unknown);
	}

	[Fact]
	public async Task GetAllJobStatusesAsync_ReturnsHealthyStatus_WhenJobExecutedWithinIntervalAsync()
	{
		// Arrange
		DateTimeOffset now =
			TimeProviderFake.GetUtcNow();

		DateTimeOffset lastExecutedAt =
			now.AddHours(-23); // Within 24-hour interval

		DateTimeOffset nextScheduledAt =
			now.AddHours(1);

		RecurringJobExecution execution =
			new()
			{
				JobName = "RefreshTokenCleanupJob",
				LastExecutedAt = lastExecutedAt,
				NextScheduledAt = nextScheduledAt,
				LastExecutedBy = "System",
			};

		RecurringJobRepository
			.GetAllAsync(Arg.Any<CancellationToken>())
			.Returns([execution]);

		ScheduledJobService service =
			CreateSut();

		// Act
		IReadOnlyList<RecurringJobStatusResponse> result =
			await service.GetAllJobStatusesAsync(CancellationToken.None);

		// Assert
		RecurringJobStatusResponse refreshTokenJob =
			result.Single(
				job => job.JobName == "RefreshTokenCleanupJob");

		refreshTokenJob.Status.ShouldBe(HealthStatusConstants.Healthy);
		refreshTokenJob.LastExecutedAt.ShouldBe(lastExecutedAt);
		refreshTokenJob.LastExecutedBy.ShouldBe("System");
	}

	[Fact]
	public async Task GetAllJobStatusesAsync_ReturnsDegradedStatus_WhenJobExceedsIntervalAsync()
	{
		// Arrange
		DateTimeOffset now =
			TimeProviderFake.GetUtcNow();

		DateTimeOffset lastExecutedAt =
			now.AddHours(-30); // Exceeds 24-hour interval + grace period

		DateTimeOffset nextScheduledAt =
			now.AddHours(-6);

		RecurringJobExecution execution =
			new()
			{
				JobName = "RefreshTokenCleanupJob",
				LastExecutedAt = lastExecutedAt,
				NextScheduledAt = nextScheduledAt,
				LastExecutedBy = "System",
			};

		RecurringJobRepository
			.GetAllAsync(Arg.Any<CancellationToken>())
			.Returns([execution]);

		ScheduledJobService service =
			CreateSut();

		// Act
		IReadOnlyList<RecurringJobStatusResponse> result =
			await service.GetAllJobStatusesAsync(CancellationToken.None);

		// Assert
		RecurringJobStatusResponse refreshTokenJob =
			result.Single(
				job => job.JobName == "RefreshTokenCleanupJob");

		refreshTokenJob.Status.ShouldBe(HealthStatusConstants.Degraded);
	}
}