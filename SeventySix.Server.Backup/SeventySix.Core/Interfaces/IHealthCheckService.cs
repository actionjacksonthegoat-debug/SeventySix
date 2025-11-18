// <copyright file="IHealthCheckService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Core.DTOs.Health;

namespace SeventySix.Core.Interfaces;

/// <summary>
/// Service interface for system health check operations.
/// </summary>
/// <remarks>
/// Provides methods to retrieve comprehensive system health status including
/// database, external APIs, error queue, and system resources.
/// Follows ISP by defining only health check operations.
/// </remarks>
public interface IHealthCheckService
{
	/// <summary>
	/// Retrieves comprehensive system health status.
	/// </summary>
	/// <param name="cancellationToken">Cancellation token for the async operation.</param>
	/// <returns>Comprehensive health status for all system components.</returns>
	public Task<HealthStatusResponse> GetHealthStatusAsync(CancellationToken cancellationToken);
}