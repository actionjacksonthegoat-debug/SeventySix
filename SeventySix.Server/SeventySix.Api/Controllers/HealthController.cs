// <copyright file="HealthController.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using SeventySix.Api.Attributes;
using SeventySix.Core.DTOs.Health;
using SeventySix.Core.Interfaces;

namespace SeventySix.Api.Controllers;

/// <summary>
/// API controller for system health monitoring.
/// </summary>
/// <remarks>
/// Provides endpoints for retrieving comprehensive system health status
/// including database, external APIs, error queue, and system resources.
/// Follows SRP by handling only health check operations.
/// </remarks>
/// <remarks>
/// Initializes a new instance of the <see cref="HealthController"/> class.
/// </remarks>
/// <param name="service">The health check service.</param>
[ApiController]
[Route("api/[controller]")]
[RateLimit()] // 250 req/hour (default)
public class HealthController(IHealthCheckService service) : ControllerBase
{

	/// <summary>
	/// Retrieves comprehensive system health status.
	/// </summary>
	/// <param name="cancellationToken">Cancellation token for the async operation.</param>
	/// <returns>System health status including all components.</returns>
	/// <response code="200">Returns the system health status.</response>
	[HttpGet]
	[ProducesResponseType(typeof(HealthStatusResponse), StatusCodes.Status200OK)]
	[OutputCache(PolicyName = "health")]
	public async Task<ActionResult<HealthStatusResponse>> GetHealthStatusAsync(CancellationToken cancellationToken)
	{
		HealthStatusResponse status = await service.GetHealthStatusAsync(cancellationToken);
		return Ok(status);
	}
}