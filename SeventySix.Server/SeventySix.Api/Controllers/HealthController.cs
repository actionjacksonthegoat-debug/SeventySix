// <copyright file="HealthController.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc;
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
[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
	private readonly IHealthCheckService Service;

	/// <summary>
	/// Initializes a new instance of the <see cref="HealthController"/> class.
	/// </summary>
	/// <param name="service">The health check service.</param>
	public HealthController(IHealthCheckService service)
	{
		Service = service;
	}

	/// <summary>
	/// Retrieves comprehensive system health status.
	/// </summary>
	/// <param name="cancellationToken">Cancellation token for the async operation.</param>
	/// <returns>System health status including all components.</returns>
	/// <response code="200">Returns the system health status.</response>
	[HttpGet]
	[ProducesResponseType(typeof(HealthStatusResponse), StatusCodes.Status200OK)]
	public async Task<ActionResult<HealthStatusResponse>> GetHealthStatusAsync(CancellationToken cancellationToken)
	{
		var status = await Service.GetHealthStatusAsync(cancellationToken);
		return Ok(status);
	}
}