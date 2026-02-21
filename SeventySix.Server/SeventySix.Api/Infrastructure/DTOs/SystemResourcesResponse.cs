// <copyright file="SystemResourcesResponse.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Infrastructure;

/// <summary>
/// Represents system resource usage metrics.
/// </summary>
public record SystemResourcesResponse
{
	/// <summary>
	/// Gets the CPU usage percentage.
	/// </summary>
	/// <value>
	/// Percentage from 0 to 100.
	/// </value>
	public decimal CpuUsagePercent { get; init; }

	/// <summary>
	/// Gets the memory used in megabytes.
	/// </summary>
	public long MemoryUsedMb { get; init; }

	/// <summary>
	/// Gets the total available memory in megabytes.
	/// </summary>
	public long MemoryTotalMb { get; init; }

	/// <summary>
	/// Gets the disk usage percentage.
	/// </summary>
	/// <value>
	/// Percentage from 0 to 100.
	/// </value>
	public decimal DiskUsagePercent { get; init; }
}