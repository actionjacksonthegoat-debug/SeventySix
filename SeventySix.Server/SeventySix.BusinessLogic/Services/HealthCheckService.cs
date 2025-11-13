// <copyright file="HealthCheckService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Diagnostics;
using SeventySix.Core.DTOs.Health;
using SeventySix.Core.Interfaces;

namespace SeventySix.BusinessLogic.Services;

/// <summary>
/// Service for system health check operations.
/// </summary>
/// <remarks>
/// Provides business logic for retrieving comprehensive system health status.
/// Follows SRP by handling only health check business logic.
/// </remarks>
public class HealthCheckService : IHealthCheckService
{
	/// <inheritdoc/>
	public async Task<HealthStatusResponse> GetHealthStatusAsync(CancellationToken cancellationToken)
	{
		// Run health checks in parallel for better performance
		var databaseHealthTask = CheckDatabaseHealthAsync(cancellationToken);
		var externalApisHealthTask = CheckExternalApisHealthAsync(cancellationToken);
		var errorQueueHealthTask = CheckErrorQueueHealthAsync(cancellationToken);
		var systemHealthTask = CheckSystemResourcesAsync(cancellationToken);

		await Task.WhenAll(
			databaseHealthTask,
			externalApisHealthTask,
			errorQueueHealthTask,
			systemHealthTask);

		var databaseHealth = await databaseHealthTask;
		var externalApisHealth = await externalApisHealthTask;
		var errorQueueHealth = await errorQueueHealthTask;
		var systemHealth = await systemHealthTask;

		// Determine overall status based on component statuses
		var overallStatus = DetermineOverallStatus(
			databaseHealth.Status,
			errorQueueHealth.Status);

		return new HealthStatusResponse
		{
			Status = overallStatus,
			CheckedAt = DateTime.UtcNow,
			Database = databaseHealth,
			ExternalApis = externalApisHealth,
			ErrorQueue = errorQueueHealth,
			System = systemHealth,
		};
	}

	private static Task<DatabaseHealthResponse> CheckDatabaseHealthAsync(CancellationToken cancellationToken)
	{
		// Basic implementation - in production this would check actual database connectivity
		// For now, return healthy status
		return Task.FromResult(new DatabaseHealthResponse
		{
			IsConnected = true,
			ResponseTimeMs = 25.0,
			ActiveConnections = 5,
			Status = "Healthy",
		});
	}

	private static Task<ExternalApiHealthResponse> CheckExternalApisHealthAsync(CancellationToken cancellationToken)
	{
		// Basic implementation - in production this would check actual API availability
		return Task.FromResult(new ExternalApiHealthResponse
		{
			Apis = new Dictionary<string, ApiHealthStatus>(),
		});
	}

	private static Task<QueueHealthResponse> CheckErrorQueueHealthAsync(CancellationToken cancellationToken)
	{
		// Basic implementation - in production this would check actual queue status
		return Task.FromResult(new QueueHealthResponse
		{
			QueuedItems = 0,
			FailedItems = 0,
			CircuitBreakerOpen = false,
			Status = "Healthy",
		});
	}

	private static Task<SystemResourcesResponse> CheckSystemResourcesAsync(CancellationToken cancellationToken)
	{
		// Get actual system resource metrics
		var process = Process.GetCurrentProcess();

		var memoryUsedMb = process.WorkingSet64 / 1024 / 1024;
		var totalMemoryMb = GC.GetGCMemoryInfo().TotalAvailableMemoryBytes / 1024 / 1024;

		// CPU usage is more complex to calculate accurately
		// For now, use a simple placeholder
		var cpuUsage = 0.0;

		return Task.FromResult(new SystemResourcesResponse
		{
			CpuUsagePercent = cpuUsage,
			MemoryUsedMb = memoryUsedMb,
			MemoryTotalMb = totalMemoryMb,
			DiskUsagePercent = 0.0, // Placeholder
		});
	}

	private static string DetermineOverallStatus(params string[] componentStatuses)
	{
		// If any component is Unhealthy, overall is Unhealthy
		if (componentStatuses.Any(s => s == "Unhealthy"))
		{
			return "Unhealthy";
		}

		// If any component is Degraded, overall is Degraded
		if (componentStatuses.Any(s => s == "Degraded"))
		{
			return "Degraded";
		}

		// All components are Healthy
		return "Healthy";
	}
}