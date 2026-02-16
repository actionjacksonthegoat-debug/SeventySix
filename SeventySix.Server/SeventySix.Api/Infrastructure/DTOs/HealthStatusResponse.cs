// <copyright file="HealthStatusResponse.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Constants;

namespace SeventySix.Api.Infrastructure;

/// <summary>
/// Represents the overall system health status response.
/// </summary>
/// <remarks>
/// This DTO aggregates health information from multiple system components
/// including database, external APIs, error queue, and system resources.
/// </remarks>
public class HealthStatusResponse
{
	/// <summary>
	/// Gets or sets the overall system health status.
	/// </summary>
	/// <value>
	/// Health status: "Healthy", "Degraded", or "Unhealthy".
	/// </value>
	public string Status { get; set; } = HealthStatusConstants.Healthy;

	/// <summary>
	/// Gets or sets the timestamp when the health check was performed.
	/// </summary>
	public DateTimeOffset CheckedAt { get; set; }

	/// <summary>
	/// Gets or sets the database health information.
	/// </summary>
	public DatabaseHealthResponse Database { get; set; } = new();

	/// <summary>
	/// Gets or sets the error queue health information.
	/// </summary>
	public QueueHealthResponse ErrorQueue { get; set; } = new();

	/// <summary>
	/// Gets or sets the system resources information.
	/// </summary>
	public SystemResourcesResponse System { get; set; } = new();
}