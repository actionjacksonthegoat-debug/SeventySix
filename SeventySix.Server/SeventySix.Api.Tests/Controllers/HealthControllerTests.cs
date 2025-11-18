// <copyright file="HealthControllerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc;
using Moq;
using SeventySix.Api.Controllers;
using SeventySix.BusinessLogic.DTOs.Health;
using SeventySix.BusinessLogic.Interfaces;

namespace SeventySix.Api.Tests.Controllers;

/// <summary>
/// Unit tests for HealthController.
/// </summary>
public class HealthControllerTests
{
	private readonly Mock<IHealthCheckService> MockService;
	private readonly HealthController Controller;

	public HealthControllerTests()
	{
		MockService = new Mock<IHealthCheckService>();
		Controller = new HealthController(MockService.Object);
	}

	[Fact]
	public async Task GetHealthStatus_ReturnsOkResult_WithHealthStatusAsync()
	{
		// Arrange
		HealthStatusResponse expectedStatus = new()
		{
			Status = "Healthy",
			CheckedAt = DateTime.UtcNow,
			Database = new DatabaseHealthResponse
			{
				IsConnected = true,
				ResponseTimeMs = 25.5,
				ActiveConnections = 10,
				Status = "Healthy",
			},
			ExternalApis = new ExternalApiHealthResponse
			{
				Apis = new Dictionary<string, ApiHealthStatus>
				{
					{
						"OpenWeather", new ApiHealthStatus
						{
							ApiName = "OpenWeather",
							IsAvailable = true,
							ResponseTimeMs = 150.5,
							LastChecked = DateTime.UtcNow.AddMinutes(-1),
						}
					},
				},
			},
			ErrorQueue = new QueueHealthResponse
			{
				QueuedItems = 5,
				FailedItems = 0,
				CircuitBreakerOpen = false,
				Status = "Healthy",
			},
			System = new SystemResourcesResponse
			{
				CpuUsagePercent = 45.5,
				MemoryUsedMb = 2048,
				MemoryTotalMb = 8192,
				DiskUsagePercent = 67.3,
			},
		};

		MockService.Setup(s => s.GetHealthStatusAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(expectedStatus);

		// Act
		ActionResult<HealthStatusResponse> result = await Controller.GetHealthStatusAsync(CancellationToken.None);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		HealthStatusResponse returnedStatus = Assert.IsType<HealthStatusResponse>(okResult.Value);
		Assert.Equal("Healthy", returnedStatus.Status);
		Assert.True(returnedStatus.Database.IsConnected);
		Assert.Equal(5, returnedStatus.ErrorQueue.QueuedItems);
		MockService.Verify(s => s.GetHealthStatusAsync(It.IsAny<CancellationToken>()), Times.Once);
	}

	[Fact]
	public async Task GetHealthStatus_ReturnsDegradedStatus_WhenComponentsAreDegradedAsync()
	{
		// Arrange
		HealthStatusResponse expectedStatus = new()
		{
			Status = "Degraded",
			CheckedAt = DateTime.UtcNow,
			Database = new DatabaseHealthResponse
			{
				IsConnected = true,
				ResponseTimeMs = 500,
				ActiveConnections = 50,
				Status = "Degraded",
			},
			ExternalApis = new ExternalApiHealthResponse
			{
				Apis = [],
			},
			ErrorQueue = new QueueHealthResponse
			{
				QueuedItems = 100,
				FailedItems = 10,
				CircuitBreakerOpen = false,
				Status = "Degraded",
			},
			System = new SystemResourcesResponse(),
		};

		MockService.Setup(s => s.GetHealthStatusAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(expectedStatus);

		// Act
		ActionResult<HealthStatusResponse> result = await Controller.GetHealthStatusAsync(CancellationToken.None);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		HealthStatusResponse returnedStatus = Assert.IsType<HealthStatusResponse>(okResult.Value);
		Assert.Equal("Degraded", returnedStatus.Status);
		Assert.Equal("Degraded", returnedStatus.Database.Status);
		Assert.Equal(100, returnedStatus.ErrorQueue.QueuedItems);
	}

	[Fact]
	public async Task GetHealthStatus_ReturnsUnhealthyStatus_WhenCriticalComponentsDownAsync()
	{
		// Arrange
		HealthStatusResponse expectedStatus = new()
		{
			Status = "Unhealthy",
			CheckedAt = DateTime.UtcNow,
			Database = new DatabaseHealthResponse
			{
				IsConnected = false,
				ResponseTimeMs = 0,
				ActiveConnections = 0,
				Status = "Unhealthy",
			},
			ExternalApis = new ExternalApiHealthResponse
			{
				Apis = [],
			},
			ErrorQueue = new QueueHealthResponse
			{
				QueuedItems = 0,
				FailedItems = 0,
				CircuitBreakerOpen = true,
				Status = "Unhealthy",
			},
			System = new SystemResourcesResponse(),
		};

		MockService.Setup(s => s.GetHealthStatusAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(expectedStatus);

		// Act
		ActionResult<HealthStatusResponse> result = await Controller.GetHealthStatusAsync(CancellationToken.None);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		HealthStatusResponse returnedStatus = Assert.IsType<HealthStatusResponse>(okResult.Value);
		Assert.Equal("Unhealthy", returnedStatus.Status);
		Assert.False(returnedStatus.Database.IsConnected);
		Assert.True(returnedStatus.ErrorQueue.CircuitBreakerOpen);
	}
}
