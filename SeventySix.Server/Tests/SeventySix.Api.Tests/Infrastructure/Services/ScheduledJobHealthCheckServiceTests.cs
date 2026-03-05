// <copyright file="ScheduledJobHealthCheckServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using SeventySix.Api.Infrastructure;
using SeventySix.Shared.Constants;

namespace SeventySix.Api.Tests.Infrastructure.Services;

/// <summary>
/// Unit tests for <see cref="ScheduledJobHealthCheckService"/>.
/// </summary>
public sealed class ScheduledJobHealthCheckServiceTests
{
	private readonly IScheduledJobService JobService;
	private readonly ILogger<ScheduledJobHealthCheckService> Logger;
	private readonly ScheduledJobHealthCheckService Service;

	/// <summary>
	/// Initializes a new instance of the <see cref="ScheduledJobHealthCheckServiceTests"/> class.
	/// </summary>
	public ScheduledJobHealthCheckServiceTests()
	{
		JobService =
			Substitute.For<IScheduledJobService>();

		Logger =
			Substitute.For<ILogger<ScheduledJobHealthCheckService>>();

		IServiceProvider serviceProvider =
			Substitute.For<IServiceProvider>();

		serviceProvider
			.GetService(typeof(IScheduledJobService))
			.Returns(JobService);

		IServiceScope scope =
			Substitute.For<IServiceScope>();

		scope.ServiceProvider.Returns(serviceProvider);

		IServiceScopeFactory scopeFactory =
			Substitute.For<IServiceScopeFactory>();

		scopeFactory
			.CreateScope()
			.Returns(scope);

		Service =
			new ScheduledJobHealthCheckService(
				scopeFactory,
				Logger);
	}

	/// <summary>
	/// Verifies that a critical degraded job produces an Error-level log.
	/// </summary>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	[Fact]
	public async Task CheckJobHealthAsync_WhenCriticalJobDegraded_LogsErrorAsync()
	{
		// Arrange
		IReadOnlyList<RecurringJobStatusResponse> statuses =
			[
				new RecurringJobStatusResponse
				{
					JobName = "IpAnonymizationJob",
					DisplayName = "IP Anonymization",
					Status = HealthStatusConstants.Degraded,
					Interval = "7 days",
					LastExecutedAt = DateTimeOffset.UtcNow.AddDays(-14),
				},
			];

		JobService
			.GetAllJobStatusesAsync(Arg.Any<CancellationToken>())
			.Returns(statuses);

		// Act
		await Service.CheckJobHealthAsync(CancellationToken.None);

		// Assert — should log at Error level for a critical job
		Logger
			.Received(1)
			.Log(
				LogLevel.Error,
				Arg.Any<EventId>(),
				Arg.Is<object>(formattedLogValues =>
					formattedLogValues.ToString()!.Contains("CRITICAL")),
				Arg.Any<Exception?>(),
				Arg.Any<Func<object, Exception?, string>>());
	}

	/// <summary>
	/// Verifies that a non-critical degraded job produces a Warning-level log.
	/// </summary>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	[Fact]
	public async Task CheckJobHealthAsync_WhenNonCriticalJobDegraded_LogsWarningAsync()
	{
		// Arrange
		IReadOnlyList<RecurringJobStatusResponse> statuses =
			[
				new RecurringJobStatusResponse
				{
					JobName = "LogCleanupJob",
					DisplayName = "Log Cleanup",
					Status = HealthStatusConstants.Degraded,
					Interval = "24 hours",
					LastExecutedAt = DateTimeOffset.UtcNow.AddDays(-3),
				},
			];

		JobService
			.GetAllJobStatusesAsync(Arg.Any<CancellationToken>())
			.Returns(statuses);

		// Act
		await Service.CheckJobHealthAsync(CancellationToken.None);

		// Assert — should log at Warning level for a non-critical job
		Logger
			.Received(1)
			.Log(
				LogLevel.Warning,
				Arg.Any<EventId>(),
				Arg.Any<object>(),
				Arg.Any<Exception?>(),
				Arg.Any<Func<object, Exception?, string>>());
	}

	/// <summary>
	/// Verifies that an unknown job produces a Warning-level log.
	/// </summary>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	[Fact]
	public async Task CheckJobHealthAsync_WhenJobUnknown_LogsWarningAsync()
	{
		// Arrange
		IReadOnlyList<RecurringJobStatusResponse> statuses =
			[
				new RecurringJobStatusResponse
				{
					JobName = "DatabaseMaintenanceJob",
					DisplayName = "Database Maintenance",
					Status = HealthStatusConstants.Unknown,
					Interval = "24 hours",
				},
			];

		JobService
			.GetAllJobStatusesAsync(Arg.Any<CancellationToken>())
			.Returns(statuses);

		// Act
		await Service.CheckJobHealthAsync(CancellationToken.None);

		// Assert — should log at Warning level for unknown status
		Logger
			.Received(1)
			.Log(
				LogLevel.Warning,
				Arg.Any<EventId>(),
				Arg.Any<object>(),
				Arg.Any<Exception?>(),
				Arg.Any<Func<object, Exception?, string>>());
	}

	/// <summary>
	/// Verifies that all-healthy jobs produce no warning or error logs.
	/// </summary>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	[Fact]
	public async Task CheckJobHealthAsync_WhenAllJobsHealthy_LogsNothingAsync()
	{
		// Arrange
		IReadOnlyList<RecurringJobStatusResponse> statuses =
			[
				new RecurringJobStatusResponse
				{
					JobName = "LogCleanupJob",
					DisplayName = "Log Cleanup",
					Status = HealthStatusConstants.Healthy,
					Interval = "24 hours",
					LastExecutedAt = DateTimeOffset.UtcNow.AddHours(-1),
				},
				new RecurringJobStatusResponse
				{
					JobName = "IpAnonymizationJob",
					DisplayName = "IP Anonymization",
					Status = HealthStatusConstants.Healthy,
					Interval = "7 days",
					LastExecutedAt = DateTimeOffset.UtcNow.AddDays(-1),
				},
			];

		JobService
			.GetAllJobStatusesAsync(Arg.Any<CancellationToken>())
			.Returns(statuses);

		// Act
		await Service.CheckJobHealthAsync(CancellationToken.None);

		// Assert — no warning or error logs should be produced
		Logger
			.DidNotReceive()
			.Log(
				Arg.Any<LogLevel>(),
				Arg.Any<EventId>(),
				Arg.Any<object>(),
				Arg.Any<Exception?>(),
				Arg.Any<Func<object, Exception?, string>>());
	}

	/// <summary>
	/// Verifies that service exceptions are caught and the service continues running.
	/// </summary>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	[Fact]
	public async Task CheckJobHealthAsync_WhenServiceThrows_LogsErrorAndContinuesAsync()
	{
		// Arrange
		JobService
			.GetAllJobStatusesAsync(Arg.Any<CancellationToken>())
			.ThrowsAsync(new InvalidOperationException("Database unavailable"));

		// Act — should NOT throw
		await Service.CheckJobHealthAsync(CancellationToken.None);

		// Assert — should log the exception at Error level
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
}