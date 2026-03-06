// <copyright file="JobChainWatchdogServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using SeventySix.Api.Infrastructure;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.Identity.Settings;
using SeventySix.Logging;
using SeventySix.Shared.BackgroundJobs;
using SeventySix.TestUtilities.Constants;
using Shouldly;

namespace SeventySix.Api.Tests.Infrastructure.Services;

/// <summary>
/// Unit tests for <see cref="JobChainWatchdogService"/>.
/// </summary>
public sealed class JobChainWatchdogServiceTests
{
	private readonly IRecurringJobRepository Repository;
	private readonly IRecurringJobService RecurringJobService;
	private readonly ILogger<JobChainWatchdogService> Logger;
	private readonly FakeTimeProvider TimeProvider;
	private readonly JobChainWatchdogService Service;

	/// <summary>
	/// Initializes a new instance of the <see cref="JobChainWatchdogServiceTests"/> class.
	/// </summary>
	public JobChainWatchdogServiceTests()
	{
		Repository =
			Substitute.For<IRecurringJobRepository>();

		RecurringJobService =
			Substitute.For<IRecurringJobService>();

		Logger =
			Substitute.For<ILogger<JobChainWatchdogService>>();

		TimeProvider =
			TestDates.CreateFutureTimeProvider();

		IServiceProvider serviceProvider =
			Substitute.For<IServiceProvider>();

		serviceProvider
			.GetService(typeof(IRecurringJobRepository))
			.Returns(Repository);

		serviceProvider
			.GetService(typeof(IRecurringJobService))
			.Returns(RecurringJobService);

		IServiceScope scope =
			Substitute.For<IServiceScope>();

		scope.ServiceProvider.Returns(serviceProvider);

		IServiceScopeFactory scopeFactory =
			Substitute.For<IServiceScopeFactory>();

		scopeFactory
			.CreateScope()
			.Returns(scope);

		IOptions<EmailQueueSettings> emailQueueSettings =
			Options.Create(
				new EmailQueueSettings
				{
					ProcessingIntervalSeconds = 10
				});

		IOptions<LogCleanupSettings> logCleanupSettings =
			Options.Create(
				new LogCleanupSettings
				{
					IntervalHours = 24
				});

		IOptions<RefreshTokenCleanupSettings> refreshTokenCleanupSettings =
			Options.Create(
				new RefreshTokenCleanupSettings
				{
					IntervalHours = 1
				});

		IOptions<OrphanedRegistrationCleanupSettings> orphanedRegistrationCleanupSettings =
			Options.Create(
				new OrphanedRegistrationCleanupSettings
				{
					IntervalHours = 1
				});

		IOptions<DatabaseMaintenanceSettings> databaseMaintenanceSettings =
			Options.Create(
				new DatabaseMaintenanceSettings
				{
					IntervalHours = 24
				});

		Service =
			new JobChainWatchdogService(
				scopeFactory,
				emailQueueSettings,
				logCleanupSettings,
				refreshTokenCleanupSettings,
				orphanedRegistrationCleanupSettings,
				databaseMaintenanceSettings,
				TimeProvider,
				Logger);
	}

	/// <summary>
	/// When all jobs are healthy, the watchdog should not log any warnings.
	/// </summary>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	[Fact]
	public async Task CheckAndRebootstrapAsync_WhenAllJobsHealthy_DoesNotRebootstrapAsync()
	{
		// Arrange — all jobs executed recently
		DateTimeOffset now =
			TimeProvider.GetUtcNow();

		Repository
			.GetAllAsync(Arg.Any<CancellationToken>())
			.Returns(
			[
				new RecurringJobExecution
				{
					JobName = "EmailQueueProcessJob",
					LastExecutedAt = now.AddSeconds(-5),
				},
				new RecurringJobExecution
				{
					JobName = "LogCleanupJob",
					LastExecutedAt = now.AddHours(-1),
				},
				new RecurringJobExecution
				{
					JobName = "DatabaseMaintenanceJob",
					LastExecutedAt = now.AddHours(-2),
				},
				new RecurringJobExecution
				{
					JobName = "RefreshTokenCleanupJob",
					LastExecutedAt = now.AddMinutes(-30),
				},
				new RecurringJobExecution
				{
					JobName = "IpAnonymizationJob",
					LastExecutedAt = now.AddDays(-1),
				},
				new RecurringJobExecution
				{
					JobName = "OrphanedRegistrationCleanupJob",
					LastExecutedAt = now.AddMinutes(-20),
				},
			]);

		// Act
		await Service.CheckAndRebootstrapAsync(CancellationToken.None);

		// Assert — no warning logs (no re-bootstrapping)
		Logger
			.DidNotReceive()
			.Log(
				LogLevel.Warning,
				Arg.Any<EventId>(),
				Arg.Any<object>(),
				Arg.Any<Exception?>(),
				Arg.Any<Func<object, Exception?, string>>());
	}

	/// <summary>
	/// When a job has no execution record, it should be re-bootstrapped.
	/// </summary>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	[Fact]
	public async Task CheckAndRebootstrapAsync_WhenJobMissing_RebootstrapsItAsync()
	{
		// Arrange — return empty list (no job records at all)
		Repository
			.GetAllAsync(Arg.Any<CancellationToken>())
			.Returns(new List<RecurringJobExecution>());

		// Act
		await Service.CheckAndRebootstrapAsync(CancellationToken.None);

		// Assert — all 5 jobs should produce warning logs
		Logger
			.Received(5)
			.Log(
				LogLevel.Warning,
				Arg.Any<EventId>(),
				Arg.Any<object>(),
				Arg.Any<Exception?>(),
				Arg.Any<Func<object, Exception?, string>>());
	}

	/// <summary>
	/// When a job has LastExecutedAt of MinValue (never ran), it should be re-bootstrapped.
	/// </summary>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	[Fact]
	public async Task CheckAndRebootstrapAsync_WhenJobNeverExecuted_RebootstrapsItAsync()
	{
		// Arrange — EmailQueueProcessJob has MinValue, others are healthy
		DateTimeOffset now =
			TimeProvider.GetUtcNow();

		Repository
			.GetAllAsync(Arg.Any<CancellationToken>())
			.Returns(
			[
				new RecurringJobExecution
				{
					JobName = "EmailQueueProcessJob",
					LastExecutedAt = DateTimeOffset.MinValue,
				},
				new RecurringJobExecution
				{
					JobName = "LogCleanupJob",
					LastExecutedAt = now.AddHours(-1),
				},
				new RecurringJobExecution
				{
					JobName = "DatabaseMaintenanceJob",
					LastExecutedAt = now.AddHours(-2),
				},
				new RecurringJobExecution
				{
					JobName = "RefreshTokenCleanupJob",
					LastExecutedAt = now.AddMinutes(-30),
				},
				new RecurringJobExecution
				{
					JobName = "IpAnonymizationJob",
					LastExecutedAt = now.AddDays(-1),
				},
				new RecurringJobExecution
				{
					JobName = "OrphanedRegistrationCleanupJob",
					LastExecutedAt = now.AddMinutes(-20),
				},
			]);

		// Act
		await Service.CheckAndRebootstrapAsync(CancellationToken.None);

		// Assert — only EmailQueueProcessJob should be re-bootstrapped
		Logger
			.Received(1)
			.Log(
				LogLevel.Warning,
				Arg.Any<EventId>(),
				Arg.Is<object>(formattedLogValues =>
					formattedLogValues.ToString()!.Contains("EmailQueueProcessJob")),
				Arg.Any<Exception?>(),
				Arg.Any<Func<object, Exception?, string>>());
	}

	/// <summary>
	/// When a job is stale (beyond 3x interval), it should be re-bootstrapped.
	/// </summary>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	[Fact]
	public async Task CheckAndRebootstrapAsync_WhenJobStale_RebootstrapsItAsync()
	{
		// Arrange — LogCleanupJob is 5 days old (interval=24h, threshold=72h)
		DateTimeOffset now =
			TimeProvider.GetUtcNow();

		Repository
			.GetAllAsync(Arg.Any<CancellationToken>())
			.Returns(
			[
				new RecurringJobExecution
				{
					JobName = "EmailQueueProcessJob",
					LastExecutedAt = now.AddSeconds(-5),
				},
				new RecurringJobExecution
				{
					JobName = "LogCleanupJob",
					LastExecutedAt = now.AddDays(-5),
				},
				new RecurringJobExecution
				{
					JobName = "DatabaseMaintenanceJob",
					LastExecutedAt = now.AddHours(-2),
				},
				new RecurringJobExecution
				{
					JobName = "RefreshTokenCleanupJob",
					LastExecutedAt = now.AddMinutes(-30),
				},
				new RecurringJobExecution
				{
					JobName = "IpAnonymizationJob",
					LastExecutedAt = now.AddDays(-1),
				},
				new RecurringJobExecution
				{
					JobName = "OrphanedRegistrationCleanupJob",
					LastExecutedAt = now.AddMinutes(-20),
				},
			]);

		// Act
		await Service.CheckAndRebootstrapAsync(CancellationToken.None);

		// Assert — LogCleanupJob should be re-bootstrapped
		Logger
			.Received(1)
			.Log(
				LogLevel.Warning,
				Arg.Any<EventId>(),
				Arg.Is<object>(formattedLogValues =>
					formattedLogValues.ToString()!.Contains("LogCleanupJob")),
				Arg.Any<Exception?>(),
				Arg.Any<Func<object, Exception?, string>>());
	}

	/// <summary>
	/// Database exceptions should be caught and logged, not propagated.
	/// </summary>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	[Fact]
	public async Task CheckAndRebootstrapAsync_WhenDbThrows_LogsErrorAndContinuesAsync()
	{
		// Arrange
		Repository
			.GetAllAsync(Arg.Any<CancellationToken>())
			.ThrowsAsync(new InvalidOperationException("Database unavailable"));

		// Act — should NOT throw
		await Service.CheckAndRebootstrapAsync(CancellationToken.None);

		// Assert — error logged
		Logger
			.Received(1)
			.Log(
				LogLevel.Error,
				Arg.Any<EventId>(),
				Arg.Any<object>(),
				Arg.Is<Exception?>(exception =>
					exception is InvalidOperationException),
				Arg.Any<Func<object, Exception?, string>>());
	}

	/// <summary>
	/// IsJobStale returns true when the job has no execution record.
	/// </summary>
	[Fact]
	public void IsJobStale_WhenNoRecord_ReturnsTrue()
	{
		// Arrange
		Dictionary<string, RecurringJobExecution> executionsByName =
			new();

		// Act
		bool result =
			Service.IsJobStale(
				"TestJob",
				TimeSpan.FromHours(1),
				executionsByName);

		// Assert
		result.ShouldBeTrue();
	}

	/// <summary>
	/// IsJobStale returns true when LastExecutedAt is MinValue.
	/// </summary>
	[Fact]
	public void IsJobStale_WhenMinValue_ReturnsTrue()
	{
		// Arrange
		Dictionary<string, RecurringJobExecution> executionsByName =
			new()
			{
				["TestJob"] = new RecurringJobExecution
				{
					JobName = "TestJob",
					LastExecutedAt = DateTimeOffset.MinValue,
				},
			};

		// Act
		bool result =
			Service.IsJobStale(
				"TestJob",
				TimeSpan.FromHours(1),
				executionsByName);

		// Assert
		result.ShouldBeTrue();
	}

	/// <summary>
	/// IsJobStale returns false when the job recently executed within threshold.
	/// </summary>
	[Fact]
	public void IsJobStale_WhenRecentlyExecuted_ReturnsFalse()
	{
		// Arrange — executed 1 hour ago, interval is 24 hours, threshold is 72 hours
		DateTimeOffset now =
			TimeProvider.GetUtcNow();

		Dictionary<string, RecurringJobExecution> executionsByName =
			new()
			{
				["TestJob"] = new RecurringJobExecution
				{
					JobName = "TestJob",
					LastExecutedAt = now.AddHours(-1),
				},
			};

		// Act
		bool result =
			Service.IsJobStale(
				"TestJob",
				TimeSpan.FromHours(24),
				executionsByName);

		// Assert
		result.ShouldBeFalse();
	}

	/// <summary>
	/// IsJobStale applies minimum staleness threshold of 10 minutes for short-interval jobs.
	/// </summary>
	[Fact]
	public void IsJobStale_WithShortInterval_UsesMinimumThreshold()
	{
		// Arrange — interval=10s, 3x=30s, but minimum is 10min
		// Executed 5 minutes ago — within 10 min threshold
		DateTimeOffset now =
			TimeProvider.GetUtcNow();

		Dictionary<string, RecurringJobExecution> executionsByName =
			new()
			{
				["TestJob"] = new RecurringJobExecution
				{
					JobName = "TestJob",
					LastExecutedAt = now.AddMinutes(-5),
				},
			};

		// Act
		bool result =
			Service.IsJobStale(
				"TestJob",
				TimeSpan.FromSeconds(10),
				executionsByName);

		// Assert — not stale because min threshold is 10 minutes
		result.ShouldBeFalse();
	}
}