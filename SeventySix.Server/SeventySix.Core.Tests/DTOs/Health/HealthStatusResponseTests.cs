// <copyright file="HealthStatusResponseTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Core.DTOs.Health;

namespace SeventySix.Core.Tests.DTOs.Health;

/// <summary>
/// Unit tests for Health DTOs.
/// </summary>
public class HealthStatusResponseTests
{
	[Fact]
	public void HealthStatusResponse_Constructor_ShouldInitializeWithDefaults()
	{
		// Arrange & Act
		var response = new HealthStatusResponse();

		// Assert
		Assert.Equal("Healthy", response.Status);
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
		var now = DateTime.UtcNow;
		var response = new HealthStatusResponse
		{
			Status = "Degraded",
			CheckedAt = now,
			Database = new DatabaseHealthResponse { IsConnected = true },
			ExternalApis = new ExternalApiHealthResponse(),
			ErrorQueue = new QueueHealthResponse(),
			System = new SystemResourcesResponse(),
		};

		// Assert
		Assert.Equal("Degraded", response.Status);
		Assert.Equal(now, response.CheckedAt);
		Assert.True(response.Database.IsConnected);
	}

	[Fact]
	public void DatabaseHealthResponse_Constructor_ShouldInitializeWithDefaults()
	{
		// Arrange & Act
		var response = new DatabaseHealthResponse();

		// Assert
		Assert.False(response.IsConnected);
		Assert.Equal(0, response.ResponseTimeMs);
		Assert.Equal(0, response.ActiveConnections);
		Assert.Equal("Healthy", response.Status);
	}

	[Fact]
	public void DatabaseHealthResponse_Properties_ShouldSetAndGetCorrectly()
	{
		// Arrange & Act
		var response = new DatabaseHealthResponse
		{
			IsConnected = true,
			ResponseTimeMs = 25.5,
			ActiveConnections = 10,
			Status = "Healthy",
		};

		// Assert
		Assert.True(response.IsConnected);
		Assert.Equal(25.5, response.ResponseTimeMs);
		Assert.Equal(10, response.ActiveConnections);
		Assert.Equal("Healthy", response.Status);
	}

	[Fact]
	public void ExternalApiHealthResponse_Constructor_ShouldInitializeWithEmptyDictionary()
	{
		// Arrange & Act
		var response = new ExternalApiHealthResponse();

		// Assert
		Assert.NotNull(response.Apis);
		Assert.Empty(response.Apis);
	}

	[Fact]
	public void ExternalApiHealthResponse_Apis_ShouldStoreMultipleApis()
	{
		// Arrange
		var now = DateTime.UtcNow;
		var response = new ExternalApiHealthResponse
		{
			Apis = new Dictionary<string, ApiHealthStatus>
			{
				{
					"OpenWeather", new ApiHealthStatus
					{
						ApiName = "OpenWeather",
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
		Assert.True(response.Apis["OpenWeather"].IsAvailable);
		Assert.False(response.Apis["GoogleMaps"].IsAvailable);
		Assert.Equal(150.5, response.Apis["OpenWeather"].ResponseTimeMs);
		Assert.Equal(now, response.Apis["OpenWeather"].LastChecked);
		Assert.Null(response.Apis["GoogleMaps"].LastChecked);
	}

	[Fact]
	public void ApiHealthStatus_Constructor_ShouldInitializeWithDefaults()
	{
		// Arrange & Act
		var status = new ApiHealthStatus();

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
		var response = new QueueHealthResponse();

		// Assert
		Assert.Equal(0, response.QueuedItems);
		Assert.Equal(0, response.FailedItems);
		Assert.False(response.CircuitBreakerOpen);
		Assert.Equal("Healthy", response.Status);
	}

	[Fact]
	public void QueueHealthResponse_Properties_ShouldSetAndGetCorrectly()
	{
		// Arrange & Act
		var response = new QueueHealthResponse
		{
			QueuedItems = 5,
			FailedItems = 2,
			CircuitBreakerOpen = true,
			Status = "Degraded",
		};

		// Assert
		Assert.Equal(5, response.QueuedItems);
		Assert.Equal(2, response.FailedItems);
		Assert.True(response.CircuitBreakerOpen);
		Assert.Equal("Degraded", response.Status);
	}

	[Fact]
	public void SystemResourcesResponse_Constructor_ShouldInitializeWithDefaults()
	{
		// Arrange & Act
		var response = new SystemResourcesResponse();

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
		var response = new SystemResourcesResponse
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