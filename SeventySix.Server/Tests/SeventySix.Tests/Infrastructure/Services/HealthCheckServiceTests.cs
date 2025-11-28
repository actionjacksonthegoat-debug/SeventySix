// <copyright file="HealthCheckServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using NSubstitute;
using SeventySix.Infrastructure;
using SeventySix.Logging;

namespace SeventySix.Tests.Infrastructure;

/// <summary>
/// Unit tests for HealthCheckService.
/// </summary>
public class HealthCheckServiceTests
{
	private readonly IMetricsService MetricsService;
	private readonly ILogService LogService;
	private readonly IHealthCheckService Service;

	public HealthCheckServiceTests()
	{
		MetricsService = Substitute.For<IMetricsService>();
		LogService = Substitute.For<ILogService>();

		// Setup default mock behaviors
		LogService.CheckDatabaseHealthAsync()
			.Returns(true);

		Service = new HealthCheckService(MetricsService, LogService);
	}

	[Fact]
	public async Task GetHealthStatusAsync_ReturnsHealthyStatusAsync()
	{
		// Act
		HealthStatusResponse result = await Service.GetHealthStatusAsync(CancellationToken.None);

		// Assert
		Assert.NotNull(result);
		Assert.Equal("Healthy", result.Status);
		Assert.NotNull(result.Database);
		Assert.NotNull(result.ExternalApis);
		Assert.NotNull(result.ErrorQueue);
		Assert.NotNull(result.System);
		Assert.True(result.CheckedAt <= DateTime.UtcNow);
		Assert.True(result.CheckedAt > DateTime.UtcNow.AddSeconds(-5));
	}

	[Fact]
	public async Task GetHealthStatusAsync_DatabaseIsConnectedAsync()
	{
		// Act
		HealthStatusResponse result = await Service.GetHealthStatusAsync(CancellationToken.None);

		// Assert
		Assert.True(result.Database.IsConnected);
		Assert.Equal("Healthy", result.Database.Status);
		Assert.True(result.Database.ResponseTimeMs >= 0);
		Assert.True(result.Database.ActiveConnections >= 0);
	}

	[Fact]
	public async Task GetHealthStatusAsync_ExternalApisInitializedAsync()
	{
		// Act
		HealthStatusResponse result = await Service.GetHealthStatusAsync(CancellationToken.None);

		// Assert
		Assert.NotNull(result.ExternalApis);
		Assert.NotNull(result.ExternalApis.Apis);
	}

	[Fact]
	public async Task GetHealthStatusAsync_ErrorQueueHealthyAsync()
	{
		// Act
		HealthStatusResponse result = await Service.GetHealthStatusAsync(CancellationToken.None);

		// Assert
		Assert.NotNull(result.ErrorQueue);
		Assert.Equal("Healthy", result.ErrorQueue.Status);
		Assert.False(result.ErrorQueue.CircuitBreakerOpen);
		Assert.True(result.ErrorQueue.QueuedItems >= 0);
		Assert.True(result.ErrorQueue.FailedItems >= 0);
	}

	[Fact]
	public async Task GetHealthStatusAsync_SystemResourcesPopulatedAsync()
	{
		// Act
		HealthStatusResponse result = await Service.GetHealthStatusAsync(CancellationToken.None);

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