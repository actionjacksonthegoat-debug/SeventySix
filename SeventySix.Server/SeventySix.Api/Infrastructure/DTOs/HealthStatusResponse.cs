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
public record HealthStatusResponse
{
	/// <summary>
	/// Gets the overall system health status.
	/// </summary>
	/// <value>
	/// Health status: "Healthy", "Degraded", or "Unhealthy".
	/// </value>
	public string Status { get; init; } = HealthStatusConstants.Healthy;

	/// <summary>
	/// Gets the timestamp when the health check was performed.
	/// </summary>
	public DateTimeOffset CheckedAt { get; init; }

	/// <summary>
	/// Gets the database health information.
	/// </summary>
	public DatabaseHealthResponse Database { get; init; } = new();

	/// <summary>
	/// Gets the error queue health information.
	/// </summary>
	public QueueHealthResponse ErrorQueue { get; init; } = new();

	/// <summary>
	/// Gets the system resources information.
	/// </summary>
	public SystemResourcesResponse System { get; init; } = new();
}