// <copyright file="HealthCheckService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Diagnostics;
using SeventySix.Api.Configuration;
using SeventySix.Shared.Interfaces;

namespace SeventySix.Api.Infrastructure;

/// <summary>
/// Service for system health check operations.
/// </summary>
/// <remarks>
/// Provides comprehensive health status including database connectivity,
/// external API availability, error queue status, and system resources.
/// Used by the /health endpoint for monitoring and load balancer checks.
/// </remarks>
public class HealthCheckService(
	IMetricsService metricsService,
	IEnumerable<IDatabaseHealthCheck> databaseHealthChecks,
	TimeProvider timeProvider) : IHealthCheckService
{
	/// <inheritdoc/>
	public async Task<HealthStatusResponse> GetHealthStatusAsync(
		CancellationToken cancellationToken)
	{
		// Run health checks in parallel for better performance
		Task<DatabaseHealthResponse> databaseHealthTask =
			CheckDatabaseHealthAsync(cancellationToken);
		Task<QueueHealthResponse> errorQueueHealthTask =
			CheckErrorQueueHealthAsync(cancellationToken);
		Task<SystemResourcesResponse> systemHealthTask =
			CheckSystemResourcesAsync(cancellationToken);

		await Task.WhenAll(
			databaseHealthTask,
			errorQueueHealthTask,
			systemHealthTask);

		DatabaseHealthResponse databaseHealth =
			await databaseHealthTask;
		QueueHealthResponse errorQueueHealth =
			await errorQueueHealthTask;
		SystemResourcesResponse systemHealth =
			await systemHealthTask;

		// Determine overall status based on component statuses
		string overallStatus =
			DetermineOverallStatus(
				databaseHealth.Status,
				errorQueueHealth.Status);

		return new HealthStatusResponse
		{
			Status = overallStatus,
			CheckedAt =
				timeProvider.GetUtcNow().UtcDateTime,
			Database = databaseHealth,
			ErrorQueue = errorQueueHealth,
			System = systemHealth,
		};
	}

	/// <summary>
	/// Checks database health and connectivity.
	/// </summary>
	private async Task<DatabaseHealthResponse> CheckDatabaseHealthAsync(
		CancellationToken cancellationToken)
	{
		Stopwatch stopwatch = Stopwatch.StartNew();

		// Check ALL bounded context databases in parallel
		Dictionary<string, Task<bool>> healthCheckTasks =
			databaseHealthChecks.ToDictionary(
				check => check.ContextName,
				check => check.CheckHealthAsync(cancellationToken));

		await Task.WhenAll(healthCheckTasks.Values);

		stopwatch.Stop();

		// Collect results
		Dictionary<string, bool> results =
			healthCheckTasks.ToDictionary(
				kvp => kvp.Key,
				kvp => kvp.Value.Result);

		bool allHealthy =
			results.Values.All(healthy => healthy);

		return new DatabaseHealthResponse
		{
			IsConnected = allHealthy,
			ResponseTimeMs =
				stopwatch.Elapsed.TotalMilliseconds,
			Status =
				allHealthy ? "Healthy" : "Unhealthy",
			ContextResults = results,
		};
	}

	/// <summary>
	/// Checks error queue health and item counts.
	/// </summary>
	private Task<QueueHealthResponse> CheckErrorQueueHealthAsync(
		CancellationToken cancellationToken)
	{
		(int queuedItems, int failedItems) =
			metricsService.GetQueueStats();

		string status = "Healthy";
		if (failedItems > HealthCheckThresholds.UnhealthyFailedItemCount)
		{
			status = "Unhealthy";
		}
		else if (queuedItems > HealthCheckThresholds.DegradedQueuedItemCount)
		{
			status = "Degraded";
		}

		QueueHealthResponse response =
			new()
			{
				QueuedItems = queuedItems,
				FailedItems = failedItems,
				CircuitBreakerOpen =
					failedItems > HealthCheckThresholds.UnhealthyFailedItemCount,
				Status = status,
			};

		return Task.FromResult(response);
	}

	/// <summary>
	/// Checks system resource health.
	/// </summary>
	private static async Task<SystemResourcesResponse> CheckSystemResourcesAsync(
		CancellationToken cancellationToken)
	{
		// Get actual system resource metrics
		Process process = Process.GetCurrentProcess();

		long memoryUsedMb =
			process.WorkingSet64 / 1024 / 1024;
		long totalMemoryMb =
			GC.GetGCMemoryInfo().TotalAvailableMemoryBytes / 1024 / 1024;

		// Get CPU usage - works on both Linux containers and Windows
		double cpuUsage =
			await GetCpuUsageAsync(process, cancellationToken);

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

	/// <summary>
	/// Samples process CPU usage over a short interval and returns the CPU usage percent (0-100).
	/// </summary>
	/// <param name="process">
	/// The process to measure.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// CPU usage percentage rounded to 2 decimals.
	/// </returns>
	private static async Task<double> GetCpuUsageAsync(
		Process process,
		CancellationToken cancellationToken)
	{
		try
		{
			// Take two measurements with a short interval to calculate CPU percentage
			TimeSpan startCpuTime =
				process.TotalProcessorTime;
			long startTime = Stopwatch.GetTimestamp();

			await Task.Delay(100, cancellationToken);

			TimeSpan endCpuTime =
				process.TotalProcessorTime;
			long endTime = Stopwatch.GetTimestamp();

			double cpuUsedMs =
				(endCpuTime - startCpuTime).TotalMilliseconds;
			double totalMs =
				(endTime - startTime) * 1000.0 / Stopwatch.Frequency;
			double cpuUsagePercent =
				(cpuUsedMs / (Environment.ProcessorCount * totalMs)) * 100.0;

			return Math.Round(
				Math.Min(cpuUsagePercent, 100.0),
				2);
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
				DriveInfo rootDrive =
					new("/");
				if (rootDrive.IsReady)
				{
					long totalBytes = rootDrive.TotalSize;
					long freeBytes =
						rootDrive.AvailableFreeSpace;
					long usedBytes =
						totalBytes - freeBytes;
					double usagePercent =
						(double)usedBytes / totalBytes * 100.0;
					return Math.Round(usagePercent, 2);
				}
			}
			else if (OperatingSystem.IsWindows())
			{
				// For Windows, get C: drive usage
				DriveInfo cDrive =
					new("C");
				if (cDrive.IsReady)
				{
					long totalBytes = cDrive.TotalSize;
					long freeBytes =
						cDrive.AvailableFreeSpace;
					long usedBytes =
						totalBytes - freeBytes;
					double usagePercent =
						(double)usedBytes / totalBytes * 100.0;
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

	private static string DetermineOverallStatus(
		params string[] componentStatuses)
	{
		// If any component is Unhealthy, overall is Unhealthy
		if (componentStatuses.Any(status => status == "Unhealthy"))
		{
			return "Unhealthy";
		}

		// If any component is Degraded, overall is Degraded
		if (componentStatuses.Any(status => status == "Degraded"))
		{
			return "Degraded";
		}

		// All components are Healthy
		return "Healthy";
	}
}