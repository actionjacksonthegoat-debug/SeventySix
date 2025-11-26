// <copyright file="HealthCheckService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Diagnostics;
using SeventySix.Logging;

namespace SeventySix.Infrastructure;

/// <summary>
/// Service for system health check operations.
/// </summary>
/// <remarks>
/// Provides comprehensive health status including database connectivity,
/// external API availability, error queue status, and system resources.
/// Used by the /health endpoint for monitoring and load balancer checks.
/// </remarks>
public class HealthCheckService(IMetricsService metricsService, ILogService logService) : IHealthCheckService
{
	/// <summary>
	/// Retrieves comprehensive system health status.
	/// </summary>
	/// <param name="cancellationToken">Cancellation token for the async operation.</param>
	/// <returns>Comprehensive health status for all system components.</returns>
	/// <remarks>
	/// Executes health checks in parallel to minimize total check duration.
	/// Returns detailed status for each component with error messages if unhealthy.
	/// Used by monitoring systems and load balancers for availability decisions.
	/// </remarks>
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

	/// <summary>
	/// Checks database health and connectivity.
	/// </summary>
	/// <param name="cancellationToken">Cancellation token for the async operation.</param>
	/// <returns>Database health status with connection details.</returns>
	/// <remarks>
	/// Delegates to Logging bounded context service for database connectivity check.
	/// Measures response time and active connection count.
	/// </remarks>
	private async Task<DatabaseHealthResponse> CheckDatabaseHealthAsync(CancellationToken cancellationToken)
	{
		Stopwatch stopwatch = Stopwatch.StartNew();

		// Call Logging bounded context service for database health check
		bool isHealthy = await logService.CheckDatabaseHealthAsync(cancellationToken);

		stopwatch.Stop();

		int activeConnections = metricsService.GetActiveDbConnections();

		return new DatabaseHealthResponse
		{
			IsConnected = isHealthy,
			ResponseTimeMs = stopwatch.Elapsed.TotalMilliseconds,
			ActiveConnections = activeConnections,
			Status = isHealthy ? "Healthy" : "Unhealthy",
		};
	}

	/// <summary>
	/// Checks external API health and availability.
	/// </summary>
	/// <param name="cancellationToken">Cancellation token for the async operation.</param>
	/// <returns>External API health status.</returns>
	/// <remarks>
	/// Placeholder for actual external API health checks.
	/// Should be implemented based on specific external dependencies.
	/// </remarks>
	private static Task<ExternalApiHealthResponse> CheckExternalApisHealthAsync(CancellationToken cancellationToken)
	{
		// Placeholder - implement actual external API checks as needed
		ExternalApiHealthResponse response = new()
		{
			Apis = [],
		};

		return Task.FromResult(response);
	}

	/// <summary>
	/// Checks error queue health and item counts.
	/// </summary>
	/// <param name="cancellationToken">Cancellation token for the async operation.</param>
	/// <returns>Error queue health status.</returns>
	/// <remarks>
	/// Retrieves queue statistics from metrics service.
	/// Determines health based on failed item threshold.
	/// </remarks>
	private Task<QueueHealthResponse> CheckErrorQueueHealthAsync(CancellationToken cancellationToken)
	{
		(int queuedItems, int failedItems) = metricsService.GetQueueStats();

		string status = "Healthy";
		if (failedItems > 10)
		{
			status = "Unhealthy";
		}
		else if (queuedItems > 50)
		{
			status = "Degraded";
		}

		QueueHealthResponse response = new()
		{
			QueuedItems = queuedItems,
			FailedItems = failedItems,
			CircuitBreakerOpen = failedItems > 10,
			Status = status,
		};

		return Task.FromResult(response);
	}

	/// <summary>
	/// Checks system resource health.
	/// </summary>
	/// <param name="cancellationToken">Cancellation token for the async operation.</param>
	/// <returns>System resource health status.</returns>
	/// <remarks>
	/// Monitors CPU usage, memory consumption, and disk usage.
	/// Determines health based on resource utilization thresholds.
	/// </remarks>
	private static async Task<SystemResourcesResponse> CheckSystemResourcesAsync(CancellationToken cancellationToken)
	{
		// Get actual system resource metrics
		Process process = Process.GetCurrentProcess();

		long memoryUsedMb = process.WorkingSet64 / 1024 / 1024;
		long totalMemoryMb = GC.GetGCMemoryInfo().TotalAvailableMemoryBytes / 1024 / 1024;

		// Get CPU usage - works on both Linux containers and Windows
		double cpuUsage = await GetCpuUsageAsync(process, cancellationToken);

		// Get disk usage - works on both Linux containers and Windows
		double diskUsage = GetDiskUsage();

		return new SystemResourcesResponse
		{
			CpuUsagePercent = cpuUsage,
			MemoryUsedMb = memoryUsedMb,
			MemoryTotalMb = totalMemoryMb,
			DiskUsagePercent = diskUsage,
		};
	}

	private static async Task<double> GetCpuUsageAsync(Process process, CancellationToken cancellationToken)
	{
		try
		{
			// Take two measurements with a short interval to calculate CPU percentage
			TimeSpan startCpuTime = process.TotalProcessorTime;
			long startTime = Stopwatch.GetTimestamp();

			await Task.Delay(100, cancellationToken);

			TimeSpan endCpuTime = process.TotalProcessorTime;
			long endTime = Stopwatch.GetTimestamp();

			double cpuUsedMs = (endCpuTime - startCpuTime).TotalMilliseconds;
			double totalMs = (endTime - startTime) * 1000.0 / Stopwatch.Frequency;
			double cpuUsagePercent = (cpuUsedMs / (Environment.ProcessorCount * totalMs)) * 100.0;

			return Math.Round(Math.Min(cpuUsagePercent, 100.0), 2);
		}
		catch
		{
			return 0.0;
		}
	}

	private static double GetDiskUsage()
	{
		try
		{
			// For Linux containers, read from /proc/mounts and df-style info
			if (OperatingSystem.IsLinux())
			{
				// Get the root filesystem usage
				DriveInfo rootDrive = new("/");
				if (rootDrive.IsReady)
				{
					long totalBytes = rootDrive.TotalSize;
					long freeBytes = rootDrive.AvailableFreeSpace;
					long usedBytes = totalBytes - freeBytes;
					double usagePercent = (double)usedBytes / totalBytes * 100.0;
					return Math.Round(usagePercent, 2);
				}
			}
			else if (OperatingSystem.IsWindows())
			{
				// For Windows, get C: drive usage
				DriveInfo cDrive = new("C");
				if (cDrive.IsReady)
				{
					long totalBytes = cDrive.TotalSize;
					long freeBytes = cDrive.AvailableFreeSpace;
					long usedBytes = totalBytes - freeBytes;
					double usagePercent = (double)usedBytes / totalBytes * 100.0;
					return Math.Round(usagePercent, 2);
				}
			}

			return 0.0;
		}
		catch
		{
			return 0.0;
		}
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
