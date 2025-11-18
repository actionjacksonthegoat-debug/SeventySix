// <copyright file="HealthCheckService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Diagnostics;
using SeventySix.BusinessLogic.DTOs.Health;
using SeventySix.BusinessLogic.Interfaces;

namespace SeventySix.BusinessLogic.Services;

/// <summary>
/// Service for system health check operations.
/// </summary>
/// <remarks>
/// Provides business logic for retrieving comprehensive system health status.
/// Follows SRP by handling only health check business logic.
/// </remarks>
/// <param name="metricsService">Metrics service for tracking health metrics.</param>
/// <param name="logRepository">Log repository for database health checks.</param>
public class HealthCheckService(IMetricsService metricsService, ILogRepository logRepository) : IHealthCheckService
{
	/// <inheritdoc/>
	public async Task<HealthStatusResponse> GetHealthStatusAsync(CancellationToken cancellationToken)
	{
		// Run health checks in parallel for better performance
		Task<DatabaseHealthResponse> databaseHealthTask = CheckDatabaseHealthAsync(cancellationToken);
		Task<ExternalApiHealthResponse> externalApisHealthTask = CheckExternalApisHealthAsync(cancellationToken);
		Task<QueueHealthResponse> errorQueueHealthTask = CheckErrorQueueHealthAsync(cancellationToken);
		Task<SystemResourcesResponse> systemHealthTask = CheckSystemResourcesAsync(cancellationToken);

		await Task.WhenAll(
			databaseHealthTask,
			externalApisHealthTask,
			errorQueueHealthTask,
			systemHealthTask);

		DatabaseHealthResponse databaseHealth = await databaseHealthTask;
		ExternalApiHealthResponse externalApisHealth = await externalApisHealthTask;
		QueueHealthResponse errorQueueHealth = await errorQueueHealthTask;
		SystemResourcesResponse systemHealth = await systemHealthTask;

		// Determine overall status based on component statuses
		string overallStatus = DetermineOverallStatus(
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

	private async Task<DatabaseHealthResponse> CheckDatabaseHealthAsync(CancellationToken cancellationToken)
	{
		try
		{
			Stopwatch stopwatch = Stopwatch.StartNew();

			// Check database connectivity with a simple count query
			// This will throw if database is not accessible
			_ = await logRepository.GetLogsCountAsync(cancellationToken: cancellationToken);

			stopwatch.Stop();

			// Get connection statistics from metrics service
			int activeConnections = metricsService.GetActiveDbConnections();

			return new DatabaseHealthResponse
			{
				IsConnected = true,
				ResponseTimeMs = stopwatch.Elapsed.TotalMilliseconds,
				ActiveConnections = activeConnections,
				Status = "Healthy",
			};
		}
		catch (Exception)
		{
			return new DatabaseHealthResponse
			{
				IsConnected = false,
				ResponseTimeMs = 0,
				ActiveConnections = 0,
				Status = "Unhealthy",
			};
		}
	}

	private static Task<ExternalApiHealthResponse> CheckExternalApisHealthAsync(CancellationToken cancellationToken)
	{
		// Basic implementation - in production this would check actual API availability
		// For now, we don't have external API health monitoring implemented
		return Task.FromResult(new ExternalApiHealthResponse
		{
			Apis = [],
		});
	}

	private Task<QueueHealthResponse> CheckErrorQueueHealthAsync(CancellationToken cancellationToken)
	{
		// Get queue statistics from metrics service
		(int queuedItems, int failedItems) = metricsService.GetQueueStats();

		// Determine status based on queue size
		string status = "Healthy";
		if (failedItems > 10)
		{
			status = "Unhealthy";
		}
		else if (queuedItems > 50)
		{
			status = "Degraded";
		}

		return Task.FromResult(new QueueHealthResponse
		{
			QueuedItems = queuedItems,
			FailedItems = failedItems,
			CircuitBreakerOpen = failedItems > 10, // Simple heuristic
			Status = status,
		});
	}

	private static Task<SystemResourcesResponse> CheckSystemResourcesAsync(CancellationToken cancellationToken)
	{
		// Get actual system resource metrics from the current process
		Process process = Process.GetCurrentProcess();

		long memoryUsedMb = process.WorkingSet64 / 1024 / 1024;
		long totalMemoryMb = GC.GetGCMemoryInfo().TotalAvailableMemoryBytes / 1024 / 1024;

		// CPU usage calculation - get current usage
		// Note: First call to TotalProcessorTime returns time since process start
		// For real-time monitoring, this should be calculated over an interval
		double cpuUsage = 0.0;

		return Task.FromResult(new SystemResourcesResponse
		{
			CpuUsagePercent = cpuUsage,
			MemoryUsedMb = memoryUsedMb,
			MemoryTotalMb = totalMemoryMb,
			DiskUsagePercent = 0.0, // Placeholder - would need DriveInfo to calculate
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