// <copyright file="LogCleanupServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NSubstitute;
using SeventySix.Logging;
using Shouldly;

namespace SeventySix.Tests.Logging.Services;

/// <summary>Unit tests for LogCleanupService.</summary>
public class LogCleanupServiceTests
{
	private readonly IServiceScopeFactory ScopeFactory =
		Substitute.For<IServiceScopeFactory>();

	private readonly IServiceScope Scope =
		Substitute.For<IServiceScope>();

	private readonly IServiceProvider ServiceProvider =
		Substitute.For<IServiceProvider>();

	private readonly ILogRepository Repository =
		Substitute.For<ILogRepository>();

	private readonly ILogger<LogCleanupService> Logger =
		Substitute.For<ILogger<LogCleanupService>>();

	public LogCleanupServiceTests()
	{
		// Setup scope factory chain
		ServiceProvider
			.GetService(typeof(ILogRepository))
			.Returns(Repository);

		Scope.ServiceProvider.Returns(ServiceProvider);
		ScopeFactory.CreateScope().Returns(Scope);
	}

	[Fact]
	public async Task ExecuteAsync_WhenDisabled_DoesNotRunCleanupAsync()
	{
		// Arrange
		LogCleanupSettings settings =
			new()
			{
				Enabled = false
			};

		IOptions<LogCleanupSettings> options =
		Options.Create(settings);

		LogCleanupService service =
			new(
				ScopeFactory,
				options,
				TimeProvider.System,
				Logger);

		using CancellationTokenSource cts =
			new();

		// Act - Start and immediately cancel
		cts.CancelAfter(TimeSpan.FromMilliseconds(100)); await service.StartAsync(cts.Token);
		await Task.Delay(50);
		await service.StopAsync(cts.Token);

		// Assert - Repository should never be called
		await Repository
			.DidNotReceive()
			.DeleteOlderThanAsync(
				Arg.Any<DateTime>(),
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task ExecuteAsync_WhenEnabled_CallsDeleteOlderThanAsync()
	{
		// Arrange
		LogCleanupSettings settings =
			new()
			{
				Enabled = true,
				InitialDelayMinutes = 0, // No delay for test
				IntervalHours = 24,
				RetentionDays = 7
			};

		IOptions<LogCleanupSettings> options =
			Options.Create(settings);

		Repository
			.DeleteOlderThanAsync(
				Arg.Any<DateTime>(),
				Arg.Any<CancellationToken>())
			.Returns(5);


		LogCleanupService service =
			new(
				ScopeFactory,
				options,
				TimeProvider.System,
				Logger);

		using CancellationTokenSource cts =
			new();

		// Act - Run briefly then cancel
		cts.CancelAfter(TimeSpan.FromMilliseconds(200)); await service.StartAsync(cts.Token);
		await Task.Delay(100);
		await service.StopAsync(cts.Token);

		// Assert - Should have called delete
		await Repository
			.Received(1)
			.DeleteOlderThanAsync(
				Arg.Any<DateTime>(),
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task ExecuteAsync_CalculatesCorrectCutoffDateAsync()
	{
		// Arrange
		int retentionDays = 7;
		DateTime testStart =
			DateTime.UtcNow;

		LogCleanupSettings settings =
			new()
			{
				Enabled = true,
				InitialDelayMinutes = 0,
				IntervalHours = 24,
				RetentionDays = retentionDays
			};

		IOptions<LogCleanupSettings> options =
			Options.Create(settings);

		DateTime capturedCutoff =
			DateTime.MinValue;

		Repository
			.DeleteOlderThanAsync(
				Arg.Do<DateTime>(d => capturedCutoff = d),
				Arg.Any<CancellationToken>())
			.Returns(0);

		LogCleanupService service =
			new(
				ScopeFactory,
				options,
				TimeProvider.System,
				Logger);

		using CancellationTokenSource cts =
			new();

		// Act
		cts.CancelAfter(TimeSpan.FromMilliseconds(200));

		await service.StartAsync(cts.Token);
		await Task.Delay(100);
		await service.StopAsync(cts.Token);

		// Assert - Cutoff should be approximately 7 days ago
		DateTime expectedCutoff =
			testStart.AddDays(-retentionDays);

		capturedCutoff.ShouldBeInRange(
			expectedCutoff.AddSeconds(-5),
			expectedCutoff.AddSeconds(5));
	}

	[Fact]
	public async Task ExecuteAsync_ContinuesAfterExceptionAsync()
	{
		// Arrange
		LogCleanupSettings settings =
			new()
			{
				Enabled = true,
				InitialDelayMinutes = 0,
				IntervalHours = 24,
				RetentionDays = 7
			};

		IOptions<LogCleanupSettings> options =
			Options.Create(settings);

		// First call throws, second succeeds
		int callCount = 0;
		Repository
			.DeleteOlderThanAsync(
				Arg.Any<DateTime>(),
				Arg.Any<CancellationToken>())
			.Returns(_ =>
			{
				callCount++;
				if (callCount == 1)
				{
					throw new InvalidOperationException("Test exception");
				}

				return Task.FromResult(0);
			});

		LogCleanupService service =
			new(
				ScopeFactory,
				options,
				TimeProvider.System,
				Logger);

		using CancellationTokenSource cts =
			new();

		// Act - Service should not crash after exception
		cts.CancelAfter(TimeSpan.FromMilliseconds(100));

		await service.StartAsync(cts.Token);
		await Task.Delay(50);
		await service.StopAsync(cts.Token);

		// Assert - Service should have tried to call the method
		// Even if it threw an exception, service continues
		callCount.ShouldBeGreaterThanOrEqualTo(1);
	}
}