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

			// Check database connectivity with a simple query
			// This will throw if database is not accessible
			// Use minimal LogFilterRequest for health check
			DTOs.Logs.LogFilterRequest healthCheckRequest = new() { Page = 1, PageSize = 1 };
			_ = await logRepository.GetPagedAsync(healthCheckRequest, cancellationToken);

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
				DriveInfo rootDrive = new DriveInfo("/");
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
				DriveInfo cDrive = new DriveInfo("C");
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