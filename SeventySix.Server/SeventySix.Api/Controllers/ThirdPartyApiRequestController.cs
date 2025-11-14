// <copyright file="ThirdPartyApiRequestController.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using SeventySix.Core.DTOs.ThirdPartyRequests;
using SeventySix.Core.Interfaces;

namespace SeventySix.Api.Controllers;

/// <summary>
/// API controller for third-party API request tracking and statistics.
/// </summary>
/// <remarks>
/// Provides endpoints for retrieving API request tracking data and aggregated statistics.
/// Follows SRP by handling only third-party API request operations.
/// </remarks>
[ApiController]
[Route("api/[controller]")]
public class ThirdPartyApiRequestController : ControllerBase
{
	private readonly IThirdPartyApiRequestService Service;

	/// <summary>
	/// Initializes a new instance of the <see cref="ThirdPartyApiRequestController"/> class.
	/// </summary>
	/// <param name="service">The third-party API request service.</param>
	public ThirdPartyApiRequestController(IThirdPartyApiRequestService service)
	{
		Service = service;
	}

	/// <summary>
	/// Retrieves all third-party API request tracking records.
	/// </summary>
	/// <param name="cancellationToken">Cancellation token for the async operation.</param>
	/// <returns>A list of API request tracking records.</returns>
	/// <response code="200">Returns the list of API request records.</response>
	[HttpGet]
	[ProducesResponseType(typeof(IEnumerable<ThirdPartyApiRequestResponse>), StatusCodes.Status200OK)]
	[OutputCache(PolicyName = "thirdpartyrequests")]
	public async Task<ActionResult<IEnumerable<ThirdPartyApiRequestResponse>>> GetAllAsync(CancellationToken cancellationToken)
	{
		var requests = await Service.GetAllAsync(cancellationToken);
		return Ok(requests);
	}

	/// <summary>
	/// Retrieves aggregated statistics for third-party API requests.
	/// </summary>
	/// <param name="cancellationToken">Cancellation token for the async operation.</param>
	/// <returns>Aggregated API request statistics.</returns>
	/// <response code="200">Returns the aggregated statistics.</response>
	[HttpGet("statistics")]
	[ProducesResponseType(typeof(ThirdPartyApiStatisticsResponse), StatusCodes.Status200OK)]
	[OutputCache(PolicyName = "thirdpartyrequests")]
	public async Task<ActionResult<ThirdPartyApiStatisticsResponse>> GetStatisticsAsync(CancellationToken cancellationToken)
	{
		var statistics = await Service.GetStatisticsAsync(cancellationToken);
		return Ok(statistics);
	}
}