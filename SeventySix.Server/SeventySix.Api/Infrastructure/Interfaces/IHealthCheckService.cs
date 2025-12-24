// <copyright file="IHealthCheckService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Infrastructure;

/// <summary>System health check operations.</summary>
public interface IHealthCheckService
{
	/// <summary>
	/// Retrieves the aggregate health status for the system.
	/// </summary>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A <see cref="HealthStatusResponse"/> containing component statuses and timestamps.
	/// </returns>
	public Task<HealthStatusResponse> GetHealthStatusAsync(
		CancellationToken cancellationToken);
}