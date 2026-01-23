// <copyright file="HealthController.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using SeventySix.Api.Configuration;
using SeventySix.Api.Infrastructure;
using SeventySix.Identity.Constants;

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
	/// <remarks>
	/// Restricted to Developer and Admin roles to prevent information disclosure.
	/// Exposes internal job names, intervals, and execution history.
	/// </remarks>
	/// <param name="cancellationToken">
	/// Cancellation token for the async operation.
	/// </param>
	/// <returns>
	/// A list of scheduled job statuses with health indicators.
	/// </returns>
	/// <response code="200">Returns the list of scheduled job statuses.</response>
	/// <response code="401">Authentication required.</response>
	/// <response code="403">User does not have Developer or Admin role.</response>
	[HttpGet("scheduled-jobs")]
	[Authorize(Policy = PolicyConstants.DeveloperOrAdmin)]
	[ProducesResponseType(
		typeof(IReadOnlyList<RecurringJobStatusResponse>),
		StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status401Unauthorized)]
	[ProducesResponseType(StatusCodes.Status403Forbidden)]
	public async Task<ActionResult<IReadOnlyList<RecurringJobStatusResponse>>> GetScheduledJobsAsync(
		CancellationToken cancellationToken)
	{
		IReadOnlyList<RecurringJobStatusResponse> jobStatuses =
			await scheduledJobService.GetAllJobStatusesAsync(cancellationToken);

		return Ok(jobStatuses);
	}
}