// <copyright file="HealthStatusResponse.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Core.DTOs.Health;

/// <summary>
/// Represents the overall system health status response.
/// </summary>
/// <remarks>
/// This DTO aggregates health information from multiple system components
/// including database, external APIs, error queue, and system resources.
/// Follows SRP by representing only the health status data structure.
/// </remarks>
public class HealthStatusResponse
{
	/// <summary>
	/// Gets or sets the overall system health status.
	/// </summary>
	/// <value>
	/// Health status: "Healthy", "Degraded", or "Unhealthy".
	/// </value>
	public string Status { get; set; } = "Healthy";

	/// <summary>
	/// Gets or sets the timestamp when the health check was performed.
	/// </summary>
	public DateTime CheckedAt
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the database health information.
	/// </summary>
	public DatabaseHealthResponse Database { get; set; } = new();

	/// <summary>
	/// Gets or sets the external APIs health information.
	/// </summary>
	public ExternalApiHealthResponse ExternalApis { get; set; } = new();

	/// <summary>
	/// Gets or sets the error queue health information.
	/// </summary>
	public QueueHealthResponse ErrorQueue { get; set; } = new();

	/// <summary>
	/// Gets or sets the system resources information.
	/// </summary>
	public SystemResourcesResponse System { get; set; } = new();
}

/// <summary>
/// Represents database health status.
/// </summary>
/// <remarks>
/// Tracks database connectivity, response time, and connection pool metrics.
/// Follows SRP by encapsulating only database health concerns.
/// </remarks>
public class DatabaseHealthResponse
{
	/// <summary>
	/// Gets or sets a value indicating whether the database is connected.
	/// </summary>
	public bool IsConnected
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the database response time in milliseconds.
	/// </summary>
	public double ResponseTimeMs
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the number of active database connections.
	/// </summary>
	public int ActiveConnections
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the database health status.
	/// </summary>
	/// <value>
	/// Status: "Healthy", "Degraded", or "Unhealthy".
	/// </value>
	public string Status { get; set; } = "Healthy";
}

/// <summary>
/// Represents external APIs health status.
/// </summary>
/// <remarks>
/// Contains a collection of individual API health statuses.
/// Follows SRP by managing only external API health data.
/// </remarks>
public class ExternalApiHealthResponse
{
	/// <summary>
	/// Gets or sets the dictionary of API health statuses keyed by API name.
	/// </summary>
	public Dictionary<string, ApiHealthStatus> Apis { get; set; } = [];
}

/// <summary>
/// Represents the health status of a single external API.
/// </summary>
/// <remarks>
/// Tracks availability, response time, and last check timestamp for an API.
/// Follows SRP by representing only single API health metrics.
/// </remarks>
public class ApiHealthStatus
{
	/// <summary>
	/// Gets or sets the name of the API.
	/// </summary>
	public string ApiName { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets a value indicating whether the API is available.
	/// </summary>
	public bool IsAvailable
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the API response time in milliseconds.
	/// </summary>
	public double ResponseTimeMs
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the timestamp of the last health check.
	/// </summary>
	/// <value>
	/// Null if the API has never been checked.
	/// </value>
	public DateTime? LastChecked
	{
		get; set;
	}
}

/// <summary>
/// Represents error queue health status.
/// </summary>
/// <remarks>
/// Tracks queued items, failures, and circuit breaker state for error handling queue.
/// Follows SRP by encapsulating only queue health concerns.
/// </remarks>
public class QueueHealthResponse
{
	/// <summary>
	/// Gets or sets the number of items currently in the queue.
	/// </summary>
	public int QueuedItems
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the number of failed items in the queue.
	/// </summary>
	public int FailedItems
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets a value indicating whether the circuit breaker is open.
	/// </summary>
	/// <value>
	/// True if circuit breaker is open (blocking requests), false otherwise.
	/// </value>
	public bool CircuitBreakerOpen
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the queue health status.
	/// </summary>
	/// <value>
	/// Status: "Healthy", "Degraded", or "Unhealthy".
	/// </value>
	public string Status { get; set; } = "Healthy";
}

/// <summary>
/// Represents system resource usage metrics.
/// </summary>
/// <remarks>
/// Tracks CPU, memory, and disk usage for the application host.
/// Follows SRP by representing only system resource metrics.
/// </remarks>
public class SystemResourcesResponse
{
	/// <summary>
	/// Gets or sets the CPU usage percentage.
	/// </summary>
	/// <value>
	/// Percentage from 0 to 100.
	/// </value>
	public double CpuUsagePercent
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the memory used in megabytes.
	/// </summary>
	public long MemoryUsedMb
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the total available memory in megabytes.
	/// </summary>
	public long MemoryTotalMb
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the disk usage percentage.
	/// </summary>
	/// <value>
	/// Percentage from 0 to 100.
	/// </value>
	public double DiskUsagePercent
	{
		get; set;
	}
}