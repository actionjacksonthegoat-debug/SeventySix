// <copyright file="HealthCheckServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Api.Infrastructure;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Interfaces;

namespace SeventySix.Api.Tests.Infrastructure.Services;

/// <summary>
/// Unit tests for HealthCheckService.
/// </summary>
public class HealthCheckServiceTests
{
	private readonly IMetricsService MetricsService;
	private readonly IDatabaseHealthCheck IdentityHealthCheck;
	private readonly IDatabaseHealthCheck LoggingHealthCheck;
	private readonly IDatabaseHealthCheck ApiTrackingHealthCheck;

	public HealthCheckServiceTests()
	{
		MetricsService =
			Substitute.For<IMetricsService>();
		IdentityHealthCheck =
			Substitute.For<IDatabaseHealthCheck>();
		LoggingHealthCheck =
			Substitute.For<IDatabaseHealthCheck>();
		ApiTrackingHealthCheck =
			Substitute.For<IDatabaseHealthCheck>();

		// Setup default mock behaviors
		IdentityHealthCheck.ContextName.Returns("Identity");
		IdentityHealthCheck
			.CheckHealthAsync(Arg.Any<CancellationToken>())
			.Returns(true);

		LoggingHealthCheck.ContextName.Returns("Logging");
		LoggingHealthCheck
			.CheckHealthAsync(Arg.Any<CancellationToken>())
			.Returns(true);

		ApiTrackingHealthCheck.ContextName.Returns("ApiTracking");
		ApiTrackingHealthCheck
			.CheckHealthAsync(Arg.Any<CancellationToken>())
			.Returns(true);
	}

	private HealthCheckService CreateSut(TimeProvider? timeProvider = null)
	{
		IEnumerable<IDatabaseHealthCheck> databaseHealthChecks =
			[
			IdentityHealthCheck,
			LoggingHealthCheck,
			ApiTrackingHealthCheck,
		];

		return new HealthCheckService(
			MetricsService,
			databaseHealthChecks,
			timeProvider ?? TimeProvider.System);
	}

	[Fact]
	public async Task GetHealthStatusAsync_ReturnsHealthyStatusAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		HealthCheckService service =
			CreateSut(timeProvider);

		// Act
		HealthStatusResponse result =
			await service.GetHealthStatusAsync(
			CancellationToken.None);

		// Assert
		Assert.NotNull(result);
		Assert.Equal(HealthStatusConstants.Healthy, result.Status);
		Assert.NotNull(result.Database);
		Assert.NotNull(result.ExternalApis);
		Assert.NotNull(result.ErrorQueue);
		Assert.NotNull(result.System);
		Assert.True(result.CheckedAt <= timeProvider.GetUtcNow().UtcDateTime);
		Assert.True(
			result.CheckedAt
				> timeProvider.GetUtcNow().UtcDateTime.AddSeconds(-5));
	}

	[Fact]
	public async Task GetHealthStatusAsync_DatabaseIsConnectedAsync()
	{
		// Arrange
		HealthCheckService service = CreateSut();

		// Act
		HealthStatusResponse result =
			await service.GetHealthStatusAsync(
			CancellationToken.None);

		// Assert
		Assert.True(result.Database.IsConnected);
		Assert.Equal(HealthStatusConstants.Healthy, result.Database.Status);
		Assert.True(result.Database.ResponseTimeMs >= 0);

		// Verify all bounded contexts are checked
		Assert.NotNull(result.Database.ContextResults);
		Assert.Equal(3, result.Database.ContextResults.Count);
		Assert.True(result.Database.ContextResults.ContainsKey("Identity"));
		Assert.True(result.Database.ContextResults.ContainsKey("Logging"));
		Assert.True(result.Database.ContextResults.ContainsKey("ApiTracking"));
		Assert.True(result.Database.ContextResults["Identity"]);
		Assert.True(result.Database.ContextResults["Logging"]);
		Assert.True(result.Database.ContextResults["ApiTracking"]);
	}

	[Fact]
	public async Task GetHealthStatusAsync_ExternalApisInitializedAsync()
	{
		// Arrange
		HealthCheckService service = CreateSut();

		// Act
		HealthStatusResponse result =
			await service.GetHealthStatusAsync(
			CancellationToken.None);

		// Assert
		Assert.NotNull(result.ExternalApis);
		Assert.NotNull(result.ExternalApis.Apis);
	}

	[Fact]
	public async Task GetHealthStatusAsync_ErrorQueueHealthyAsync()
	{
		// Arrange
		HealthCheckService service = CreateSut();

		// Act
		HealthStatusResponse result =
			await service.GetHealthStatusAsync(
			CancellationToken.None);

		// Assert
		Assert.NotNull(result.ErrorQueue);
		Assert.Equal(HealthStatusConstants.Healthy, result.ErrorQueue.Status);
		Assert.False(result.ErrorQueue.CircuitBreakerOpen);
		Assert.True(result.ErrorQueue.QueuedItems >= 0);
		Assert.True(result.ErrorQueue.FailedItems >= 0);
	}

	[Fact]
	public async Task GetHealthStatusAsync_SystemResourcesPopulatedAsync()
	{
		// Arrange
		HealthCheckService service = CreateSut();

		// Act
		HealthStatusResponse result =
			await service.GetHealthStatusAsync(
			CancellationToken.None);

		// Assert
		Assert.NotNull(result.System);
		Assert.True(result.System.CpuUsagePercent >= 0);
		Assert.True(result.System.CpuUsagePercent <= 100);
		Assert.True(result.System.MemoryUsedMb >= 0);
		Assert.True(result.System.MemoryTotalMb >= result.System.MemoryUsedMb);
		Assert.True(result.System.DiskUsagePercent >= 0);
		Assert.True(result.System.DiskUsagePercent <= 100);
	}
}