// <copyright file="SystemResourcesResponse.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Infrastructure;

/// <summary>
/// Represents system resource usage metrics.
/// </summary>
public sealed class SystemResourcesResponse
{
	/// <summary>
	/// Gets or sets the CPU usage percentage.
	/// </summary>
	/// <value>
	/// Percentage from 0 to 100.
	/// </value>
	public double CpuUsagePercent { get; set; }

	/// <summary>
	/// Gets or sets the memory used in megabytes.
	/// </summary>
	public long MemoryUsedMb { get; set; }

	/// <summary>
	/// Gets or sets the total available memory in megabytes.
	/// </summary>
	public long MemoryTotalMb { get; set; }

	/// <summary>
	/// Gets or sets the disk usage percentage.
	/// </summary>
	/// <value>
	/// Percentage from 0 to 100.
	/// </value>
	public double DiskUsagePercent { get; set; }
}