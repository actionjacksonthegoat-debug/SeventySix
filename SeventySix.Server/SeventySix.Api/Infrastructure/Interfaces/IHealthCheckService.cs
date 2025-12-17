// <copyright file="IHealthCheckService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Infrastructure;

/// <summary>System health check operations.</summary>
public interface IHealthCheckService
{
	public Task<HealthStatusResponse> GetHealthStatusAsync(
		CancellationToken cancellationToken);
}