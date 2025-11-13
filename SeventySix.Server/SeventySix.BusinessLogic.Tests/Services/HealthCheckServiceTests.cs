// <copyright file="HealthCheckServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Moq;
using SeventySix.BusinessLogic.Services;
using SeventySix.Core.DTOs.Health;

namespace SeventySix.BusinessLogic.Tests.Services;

/// <summary>
/// Unit tests for HealthCheckService.
/// </summary>
public class HealthCheckServiceTests
{
	private readonly HealthCheckService Service;

	public HealthCheckServiceTests()
	{
		Service = new HealthCheckService();
	}

	[Fact]
	public async Task GetHealthStatusAsync_ReturnsHealthyStatusAsync()
	{
		// Act
		var result = await Service.GetHealthStatusAsync(CancellationToken.None);

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
		var result = await Service.GetHealthStatusAsync(CancellationToken.None);

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
		var result = await Service.GetHealthStatusAsync(CancellationToken.None);

		// Assert
		Assert.NotNull(result.ExternalApis);
		Assert.NotNull(result.ExternalApis.Apis);
	}

	[Fact]
	public async Task GetHealthStatusAsync_ErrorQueueHealthyAsync()
	{
		// Act
		var result = await Service.GetHealthStatusAsync(CancellationToken.None);

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
		var result = await Service.GetHealthStatusAsync(CancellationToken.None);

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