// <copyright file="HealthController.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using SeventySix.Api.Configuration;
using SeventySix.Api.Infrastructure;

namespace SeventySix.Api.Controllers;

/// <summary>
/// API controller for system health monitoring.
/// </summary>
/// <remarks>
/// Provides endpoints for retrieving comprehensive system health status
/// including database, external APIs, error queue, and system resources.
/// Follows SRP by handling only health check operations.
/// </remarks>
/// <param name="healthService">
/// The health check service.
/// </param>
/// <param name="scheduledJobService">
/// The scheduled job service.
/// </param>
[ApiController]
[Route(ApiVersionConfig.VersionedRoutePrefix + "/health")]
public class HealthController(
	IHealthCheckService healthService,
	IScheduledJobService scheduledJobService) : ControllerBase
{
	/// <summary>
	/// Retrieves comprehensive system health status.
	/// </summary>
	/// <param name="cancellationToken">
	/// Cancellation token for the async operation.
	/// </param>
	/// <returns>
	/// System health status including all components.
	/// </returns>
	/// <response code="200">Returns the system health status.</response>
	[HttpGet]
	[ProducesResponseType(
		typeof(HealthStatusResponse),
		StatusCodes.Status200OK
	)]
	[OutputCache(PolicyName = CachePolicyConstants.Health)]
	public async Task<ActionResult<HealthStatusResponse>> GetHealthStatusAsync(
		CancellationToken cancellationToken)
	{
		HealthStatusResponse status =
			await healthService.GetHealthStatusAsync(
				cancellationToken);
		return Ok(status);
	}

	/// <summary>
	/// Retrieves status information for all scheduled background jobs.
	/// </summary>
	/// <param name="cancellationToken">
	/// Cancellation token for the async operation.
	/// </param>
	/// <returns>
	/// A list of scheduled job statuses with health indicators.
	/// </returns>
	/// <response code="200">Returns the list of scheduled job statuses.</response>
	[HttpGet("scheduled-jobs")]
	[ProducesResponseType(
		typeof(IReadOnlyList<RecurringJobStatusResponse>),
		StatusCodes.Status200OK)]
	public async Task<ActionResult<IReadOnlyList<RecurringJobStatusResponse>>> GetScheduledJobsAsync(
		CancellationToken cancellationToken)
	{
		IReadOnlyList<RecurringJobStatusResponse> jobStatuses =
			await scheduledJobService.GetAllJobStatusesAsync(cancellationToken);

		return Ok(jobStatuses);
	}
}