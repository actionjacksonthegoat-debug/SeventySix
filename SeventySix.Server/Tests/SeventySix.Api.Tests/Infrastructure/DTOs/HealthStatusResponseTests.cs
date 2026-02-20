// <copyright file="HealthStatusResponseTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Time.Testing;
using SeventySix.Api.Infrastructure;
using SeventySix.Shared.Constants;
using Shouldly;

namespace SeventySix.Api.Tests.Infrastructure.DTOs;

/// <summary>
/// Unit tests for Health DTOs.
/// </summary>
public sealed class HealthStatusResponseTests
{
	/// <summary>
	/// Ensures HealthStatusResponse constructor initializes default values.
	/// </summary>
	[Fact]
	public void HealthStatusResponse_Constructor_ShouldInitializeWithDefaults()
	{
		// Arrange & Act
		HealthStatusResponse response = new();

		// Assert
		response.Status.ShouldBe(HealthStatusConstants.Healthy);
		response.CheckedAt.ShouldBe(default(DateTimeOffset));
		response.Database.ShouldNotBeNull();
		response.ErrorQueue.ShouldNotBeNull();
		response.System.ShouldNotBeNull();
	}

	/// <summary>
	/// Verifies HealthStatusResponse properties can be set and retrieved correctly.
	/// </summary>
	[Fact]
	public void HealthStatusResponse_Properties_ShouldSetAndGetCorrectly()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		DateTimeOffset now =
			timeProvider.GetUtcNow();
		HealthStatusResponse response =
			new()
			{
				Status =
					HealthStatusConstants.Degraded,
				CheckedAt = now,
				Database =
					new DatabaseHealthResponse { IsConnected = true },
				ErrorQueue = new QueueHealthResponse(),
				System = new SystemResourcesResponse(),
			};

		// Assert
		response.Status.ShouldBe(HealthStatusConstants.Degraded);
		response.CheckedAt.ShouldBe(now);
		response.Database.IsConnected.ShouldBeTrue();
	}

	/// <summary>
	/// Ensures DatabaseHealthResponse defaults are set by the constructor.
	/// </summary>
	[Fact]
	public void DatabaseHealthResponse_Constructor_ShouldInitializeWithDefaults()
	{
		// Arrange & Act
		DatabaseHealthResponse response = new();

		// Assert
		response.IsConnected.ShouldBeFalse();
		response.ResponseTimeMs.ShouldBe(0);
		response.Status.ShouldBe(HealthStatusConstants.Healthy);
	}

	/// <summary>
	/// Verifies DatabaseHealthResponse properties set and get correctly.
	/// </summary>
	[Fact]
	public void DatabaseHealthResponse_Properties_ShouldSetAndGetCorrectly()
	{
		// Arrange & Act
		DatabaseHealthResponse response =
			new()
			{
				IsConnected = true,
				ResponseTimeMs = 25.5,
				Status =
					HealthStatusConstants.Healthy,
			};

		// Assert
		response.IsConnected.ShouldBeTrue();
		response.ResponseTimeMs.ShouldBe(25.5);
		response.Status.ShouldBe(HealthStatusConstants.Healthy);
	}

	/// <summary>
	/// Ensures QueueHealthResponse defaults are set by the constructor.
	/// </summary>
	[Fact]
	public void QueueHealthResponse_Constructor_ShouldInitializeWithDefaults()
	{
		// Arrange & Act
		QueueHealthResponse response = new();

		// Assert
		response.QueuedItems.ShouldBe(0);
		response.FailedItems.ShouldBe(0);
		response.CircuitBreakerOpen.ShouldBeFalse();
		response.Status.ShouldBe(HealthStatusConstants.Healthy);
	}

	/// <summary>
	/// Verifies QueueHealthResponse properties set and get correctly.
	/// </summary>
	[Fact]
	public void QueueHealthResponse_Properties_ShouldSetAndGetCorrectly()
	{
		// Arrange & Act
		QueueHealthResponse response =
			new()
			{
				QueuedItems = 5,
				FailedItems = 2,
				CircuitBreakerOpen = true,
				Status =
					HealthStatusConstants.Degraded,
			};

		// Assert
		response.QueuedItems.ShouldBe(5);
		response.FailedItems.ShouldBe(2);
		response.CircuitBreakerOpen.ShouldBeTrue();
		response.Status.ShouldBe(HealthStatusConstants.Degraded);
	}

	/// <summary>
	/// Ensures SystemResourcesResponse constructor initializes default values.
	/// </summary>
	[Fact]
	public void SystemResourcesResponse_Constructor_ShouldInitializeWithDefaults()
	{
		// Arrange & Act
		SystemResourcesResponse response = new();

		// Assert
		response.CpuUsagePercent.ShouldBe(0);
		response.MemoryUsedMb.ShouldBe(0);
		response.MemoryTotalMb.ShouldBe(0);
		response.DiskUsagePercent.ShouldBe(0);
	}

	/// <summary>
	/// Verifies SystemResourcesResponse properties set and get correctly.
	/// </summary>
	[Fact]
	public void SystemResourcesResponse_Properties_ShouldSetAndGetCorrectly()
	{
		// Arrange & Act
		SystemResourcesResponse response =
			new()
			{
				CpuUsagePercent = 45.5,
				MemoryUsedMb = 2048,
				MemoryTotalMb = 8192,
				DiskUsagePercent = 67.3,
			};

		// Assert
		response.CpuUsagePercent.ShouldBe(45.5);
		response.MemoryUsedMb.ShouldBe(2048);
		response.MemoryTotalMb.ShouldBe(8192);
		response.DiskUsagePercent.ShouldBe(67.3);
	}
}