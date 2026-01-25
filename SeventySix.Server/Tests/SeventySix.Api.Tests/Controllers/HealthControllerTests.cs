// <copyright file="HealthControllerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Api.Controllers;
using SeventySix.Api.Infrastructure;

namespace SeventySix.Api.Tests.Controllers;

/// <summary>
/// Unit tests for HealthController.
/// </summary>
/// <remarks>
/// Tests the public health endpoint which returns minimal status info (PublicHealthDto).
/// Detailed health endpoint tests are in HealthControllerAuthorizationTests.
/// </remarks>
public class HealthControllerTests
{
	private readonly IHealthCheckService HealthService;
	private readonly IScheduledJobService ScheduledJobService;
	private readonly HealthController Controller;

	public HealthControllerTests()
	{
		HealthService =
			Substitute.For<IHealthCheckService>();
		ScheduledJobService =
			Substitute.For<IScheduledJobService>();
		Controller =
			new HealthController(
				HealthService,
				ScheduledJobService);
	}

	[Fact]
	public async Task GetHealthStatus_ReturnsOkResult_WithMinimalHealthStatusAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		DateTime checkedAt =
			timeProvider.GetUtcNow().UtcDateTime;

		HealthStatusResponse fullStatus =
			new()
			{
				Status = "Healthy",
				CheckedAt = checkedAt,
				Database =
					new DatabaseHealthResponse
					{
						IsConnected = true,
						ResponseTimeMs = 25.5,
						Status = "Healthy",
					},
				ExternalApis =
					new ExternalApiHealthResponse { Apis = [] },
				ErrorQueue =
					new QueueHealthResponse
					{
						QueuedItems = 5,
						FailedItems = 0,
						CircuitBreakerOpen = false,
						Status = "Healthy",
					},
				System = new SystemResourcesResponse(),
			};

		HealthService
			.GetHealthStatusAsync(Arg.Any<CancellationToken>())
			.Returns(fullStatus);

		// Act
		ActionResult<PublicHealthDto> result =
			await Controller.GetHealthStatusAsync(CancellationToken.None);

		// Assert - Only status and timestamp, no infrastructure details
		OkObjectResult okResult =
			Assert.IsType<OkObjectResult>(result.Result);
		PublicHealthDto returnedStatus =
			Assert.IsType<PublicHealthDto>(okResult.Value);
		Assert.Equal("Healthy", returnedStatus.Status);
		Assert.Equal(checkedAt, returnedStatus.CheckedAt);
		await HealthService
			.Received(1)
			.GetHealthStatusAsync(Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task GetHealthStatus_ReturnsDegradedStatus_WhenComponentsAreDegradedAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		DateTime checkedAt =
			timeProvider.GetUtcNow().UtcDateTime;

		HealthStatusResponse fullStatus =
			new()
			{
				Status = "Degraded",
				CheckedAt = checkedAt,
				Database =
					new DatabaseHealthResponse
					{
						IsConnected = true,
						ResponseTimeMs = 500,
						Status = "Degraded",
					},
				ExternalApis =
					new ExternalApiHealthResponse { Apis = [] },
				ErrorQueue =
					new QueueHealthResponse
					{
						QueuedItems = 100,
						FailedItems = 10,
						CircuitBreakerOpen = false,
						Status = "Degraded",
					},
				System = new SystemResourcesResponse(),
			};

		HealthService
			.GetHealthStatusAsync(Arg.Any<CancellationToken>())
			.Returns(fullStatus);

		// Act
		ActionResult<PublicHealthDto> result =
			await Controller.GetHealthStatusAsync(CancellationToken.None);

		// Assert - Only status exposed, no degraded component details
		OkObjectResult okResult =
			Assert.IsType<OkObjectResult>(result.Result);
		PublicHealthDto returnedStatus =
			Assert.IsType<PublicHealthDto>(okResult.Value);
		Assert.Equal("Degraded", returnedStatus.Status);
		Assert.Equal(checkedAt, returnedStatus.CheckedAt);
	}

	[Fact]
	public async Task GetHealthStatus_ReturnsUnhealthyStatus_WhenCriticalComponentsDownAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		DateTime checkedAt =
			timeProvider.GetUtcNow().UtcDateTime;

		HealthStatusResponse fullStatus =
			new()
			{
				Status = "Unhealthy",
				CheckedAt = checkedAt,
				Database =
					new DatabaseHealthResponse
					{
						IsConnected = false,
						ResponseTimeMs = 0,
						Status = "Unhealthy",
					},
				ExternalApis =
					new ExternalApiHealthResponse { Apis = [] },
				ErrorQueue =
					new QueueHealthResponse
					{
						QueuedItems = 0,
						FailedItems = 0,
						CircuitBreakerOpen = true,
						Status = "Unhealthy",
					},
				System = new SystemResourcesResponse(),
			};

		HealthService
			.GetHealthStatusAsync(Arg.Any<CancellationToken>())
			.Returns(fullStatus);

		// Act
		ActionResult<PublicHealthDto> result =
			await Controller.GetHealthStatusAsync(CancellationToken.None);

		// Assert - Only status exposed, no failure details
		OkObjectResult okResult =
			Assert.IsType<OkObjectResult>(result.Result);
		PublicHealthDto returnedStatus =
			Assert.IsType<PublicHealthDto>(okResult.Value);
		Assert.Equal("Unhealthy", returnedStatus.Status);
		Assert.Equal(checkedAt, returnedStatus.CheckedAt);
	}

	[Fact]
	public async Task GetDetailedHealthStatus_ReturnsOkResult_WithFullHealthStatusAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		DateTime checkedAt =
			timeProvider.GetUtcNow().UtcDateTime;

		HealthStatusResponse expectedStatus =
			new()
			{
				Status = "Healthy",
				CheckedAt = checkedAt,
				Database =
					new DatabaseHealthResponse
					{
						IsConnected = true,
						ResponseTimeMs = 25.5,
						Status = "Healthy",
					},
				ExternalApis =
					new ExternalApiHealthResponse { Apis = [] },
				ErrorQueue =
					new QueueHealthResponse
					{
						QueuedItems = 5,
						FailedItems = 0,
						CircuitBreakerOpen = false,
						Status = "Healthy",
					},
				System =
					new SystemResourcesResponse
					{
						CpuUsagePercent = 45.5,
						MemoryUsedMb = 2048,
						MemoryTotalMb = 8192,
						DiskUsagePercent = 67.3,
					},
			};

		HealthService
			.GetHealthStatusAsync(Arg.Any<CancellationToken>())
			.Returns(expectedStatus);

		// Act
		ActionResult<HealthStatusResponse> result =
			await Controller.GetDetailedHealthStatusAsync(CancellationToken.None);

		// Assert - Full infrastructure details exposed
		OkObjectResult okResult =
			Assert.IsType<OkObjectResult>(result.Result);
		HealthStatusResponse returnedStatus =
			Assert.IsType<HealthStatusResponse>(okResult.Value);
		Assert.Equal("Healthy", returnedStatus.Status);
		Assert.True(returnedStatus.Database.IsConnected);
		Assert.Equal(25.5, returnedStatus.Database.ResponseTimeMs);
		Assert.Equal(5, returnedStatus.ErrorQueue.QueuedItems);
		Assert.Equal(45.5, returnedStatus.System.CpuUsagePercent);
	}
}