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
/// Anonymous users receive minimal status information only.
/// Authenticated Developer/Admin users can access detailed infrastructure data.
/// </remarks>
/// <param name="healthService">
/// The health check service.
/// </param>
/// <param name="scheduledJobService">
/// The scheduled job service.
/// </param>
[ApiController]
[Route(ApiVersionConfig.VersionedRoutePrefix + "/health")]
public sealed class HealthController(
	IHealthCheckService healthService,
	IScheduledJobService scheduledJobService) : ControllerBase
{
	/// <summary>
	/// Retrieves minimal system health status (public endpoint).
	/// </summary>
	/// <remarks>
	/// Returns only overall status and timestamp.
	/// No infrastructure details exposed for security.
	/// Use /health/detailed for comprehensive information (requires Developer or Admin role).
	/// </remarks>
	/// <param name="cancellationToken">
	/// Cancellation token for the async operation.
	/// </param>
	/// <returns>
	/// Minimal health status with overall system state.
	/// </returns>
	/// <response code="200">Returns the minimal system health status.</response>
	[HttpGet]
	[ProducesResponseType(
		typeof(PublicHealthDto),
		StatusCodes.Status200OK)]
	[OutputCache(PolicyName = CachePolicyConstants.Health)]
	public async Task<ActionResult<PublicHealthDto>> GetHealthStatusAsync(
		CancellationToken cancellationToken)
	{
		HealthStatusResponse fullStatus =
			await healthService.GetHealthStatusAsync(cancellationToken);

		PublicHealthDto publicHealth =
			new(
				fullStatus.Status,
				fullStatus.CheckedAt);

		return Ok(publicHealth);
	}

	/// <summary>
	/// Retrieves comprehensive system health status with infrastructure details.
	/// </summary>
	/// <remarks>
	/// Restricted to Developer and Admin roles to prevent information disclosure.
	/// Exposes database response times, external API status, and system metrics.
	/// </remarks>
	/// <param name="cancellationToken">
	/// Cancellation token for the async operation.
	/// </param>
	/// <returns>
	/// Comprehensive health status including all infrastructure components.
	/// </returns>
	/// <response code="200">Returns the detailed system health status.</response>
	/// <response code="401">Authentication required.</response>
	/// <response code="403">User does not have Developer or Admin role.</response>
	[HttpGet("detailed")]
	[Authorize(Policy = PolicyConstants.DeveloperOrAdmin)]
	[ProducesResponseType(
		typeof(HealthStatusResponse),
		StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status401Unauthorized)]
	[ProducesResponseType(StatusCodes.Status403Forbidden)]
	[OutputCache(PolicyName = CachePolicyConstants.Health)]
	public async Task<ActionResult<HealthStatusResponse>> GetDetailedHealthStatusAsync(
		CancellationToken cancellationToken)
	{
		HealthStatusResponse status =
			await healthService.GetHealthStatusAsync(cancellationToken);

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