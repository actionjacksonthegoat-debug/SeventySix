// <copyright file="HealthStatusResponseTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Infrastructure;
using SeventySix.Shared.Constants;

namespace SeventySix.Tests.Infrastructure.DTOs;

/// <summary>
/// Unit tests for Health DTOs.
/// </summary>
public class HealthStatusResponseTests
{
	[Fact]
	public void HealthStatusResponse_Constructor_ShouldInitializeWithDefaults()
	{
		// Arrange & Act
		HealthStatusResponse response = new();

		// Assert
		Assert.Equal(HealthStatusConstants.Healthy, response.Status);
		Assert.Equal(default(DateTime), response.CheckedAt);
		Assert.NotNull(response.Database);
		Assert.NotNull(response.ExternalApis);
		Assert.NotNull(response.ErrorQueue);
		Assert.NotNull(response.System);
	}

	[Fact]
	public void HealthStatusResponse_Properties_ShouldSetAndGetCorrectly()
	{
		// Arrange
		DateTime now = DateTime.UtcNow;
		HealthStatusResponse response = new()
		{
			Status = HealthStatusConstants.Degraded,
			CheckedAt = now,
			Database = new DatabaseHealthResponse { IsConnected = true },
			ExternalApis = new ExternalApiHealthResponse(),
			ErrorQueue = new QueueHealthResponse(),
			System = new SystemResourcesResponse(),
		};

		// Assert
		Assert.Equal(HealthStatusConstants.Degraded, response.Status);
		Assert.Equal(now, response.CheckedAt);
		Assert.True(response.Database.IsConnected);
	}

	[Fact]
	public void DatabaseHealthResponse_Constructor_ShouldInitializeWithDefaults()
	{
		// Arrange & Act
		DatabaseHealthResponse response = new();

		// Assert
		Assert.False(response.IsConnected);
		Assert.Equal(0, response.ResponseTimeMs);
		Assert.Equal(0, response.ActiveConnections);
		Assert.Equal(HealthStatusConstants.Healthy, response.Status);
	}

	[Fact]
	public void DatabaseHealthResponse_Properties_ShouldSetAndGetCorrectly()
	{
		// Arrange & Act
		DatabaseHealthResponse response = new()
		{
			IsConnected = true,
			ResponseTimeMs = 25.5,
			ActiveConnections = 10,
			Status = HealthStatusConstants.Healthy,
		};

		// Assert
		Assert.True(response.IsConnected);
		Assert.Equal(25.5, response.ResponseTimeMs);
		Assert.Equal(10, response.ActiveConnections);
		Assert.Equal(HealthStatusConstants.Healthy, response.Status);
	}

	[Fact]
	public void ExternalApiHealthResponse_Constructor_ShouldInitializeWithEmptyDictionary()
	{
		// Arrange & Act
		ExternalApiHealthResponse response = new();

		// Assert
		Assert.NotNull(response.Apis);
		Assert.Empty(response.Apis);
	}

	[Fact]
	public void ExternalApiHealthResponse_Apis_ShouldStoreMultipleApis()
	{
		// Arrange
		DateTime now = DateTime.UtcNow;
		ExternalApiHealthResponse response = new()
		{
			Apis = new Dictionary<string, ApiHealthStatus>
			{
				{
					"ExternalAPI", new ApiHealthStatus
					{
						ApiName = "ExternalAPI",
						IsAvailable = true,
						ResponseTimeMs = 150.5,
						LastChecked = now,
					}
				},
				{
					"GoogleMaps", new ApiHealthStatus
					{
						ApiName = "GoogleMaps",
						IsAvailable = false,
						ResponseTimeMs = 0,
						LastChecked = null,
					}
				},
			},
		};

		// Assert
		Assert.Equal(2, response.Apis.Count);
		Assert.True(response.Apis["ExternalAPI"].IsAvailable);
		Assert.False(response.Apis["GoogleMaps"].IsAvailable);
		Assert.Equal(150.5, response.Apis["ExternalAPI"].ResponseTimeMs);
		Assert.Equal(now, response.Apis["ExternalAPI"].LastChecked);
		Assert.Null(response.Apis["GoogleMaps"].LastChecked);
	}

	[Fact]
	public void ApiHealthStatus_Constructor_ShouldInitializeWithDefaults()
	{
		// Arrange & Act
		ApiHealthStatus status = new();

		// Assert
		Assert.Equal(string.Empty, status.ApiName);
		Assert.False(status.IsAvailable);
		Assert.Equal(0, status.ResponseTimeMs);
		Assert.Null(status.LastChecked);
	}

	[Fact]
	public void QueueHealthResponse_Constructor_ShouldInitializeWithDefaults()
	{
		// Arrange & Act
		QueueHealthResponse response = new();

		// Assert
		Assert.Equal(0, response.QueuedItems);
		Assert.Equal(0, response.FailedItems);
		Assert.False(response.CircuitBreakerOpen);
		Assert.Equal(HealthStatusConstants.Healthy, response.Status);
	}

	[Fact]
	public void QueueHealthResponse_Properties_ShouldSetAndGetCorrectly()
	{
		// Arrange & Act
		QueueHealthResponse response = new()
		{
			QueuedItems = 5,
			FailedItems = 2,
			CircuitBreakerOpen = true,
			Status = HealthStatusConstants.Degraded,
		};

		// Assert
		Assert.Equal(5, response.QueuedItems);
		Assert.Equal(2, response.FailedItems);
		Assert.True(response.CircuitBreakerOpen);
		Assert.Equal(HealthStatusConstants.Degraded, response.Status);
	}

	[Fact]
	public void SystemResourcesResponse_Constructor_ShouldInitializeWithDefaults()
	{
		// Arrange & Act
		SystemResourcesResponse response = new();

		// Assert
		Assert.Equal(0, response.CpuUsagePercent);
		Assert.Equal(0, response.MemoryUsedMb);
		Assert.Equal(0, response.MemoryTotalMb);
		Assert.Equal(0, response.DiskUsagePercent);
	}

	[Fact]
	public void SystemResourcesResponse_Properties_ShouldSetAndGetCorrectly()
	{
		// Arrange & Act
		SystemResourcesResponse response = new()
		{
			CpuUsagePercent = 45.5,
			MemoryUsedMb = 2048,
			MemoryTotalMb = 8192,
			DiskUsagePercent = 67.3,
		};

		// Assert
		Assert.Equal(45.5, response.CpuUsagePercent);
		Assert.Equal(2048, response.MemoryUsedMb);
		Assert.Equal(8192, response.MemoryTotalMb);
		Assert.Equal(67.3, response.DiskUsagePercent);
	}
}