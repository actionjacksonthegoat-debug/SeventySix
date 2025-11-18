// <copyright file="ThirdPartyApiRequestsController.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using SeventySix.Api.Attributes;
using SeventySix.Api.Configuration;
using SeventySix.BusinessLogic.DTOs.ThirdPartyRequests;
using SeventySix.BusinessLogic.Interfaces;

namespace SeventySix.Api.Controllers;

/// <summary>
/// Third-party API requests tracking endpoints.
/// Provides RESTful operations for API request tracking and statistics.
/// </summary>
/// <remarks>
/// Provides endpoints for retrieving API request tracking data and aggregated statistics.
/// Follows SRP by handling only third-party API request operations.
/// </remarks>
/// <remarks>
/// Initializes a new instance of the <see cref="ThirdPartyApiRequestsController"/> class.
/// </remarks>
/// <param name="service">The third-party API request service.</param>
[ApiController]
[Route(ApiVersionConfig.VersionedRoutePrefix + "/thirdpartyrequests")]
[RateLimit()] // 250 req/hour (default)
public class ThirdPartyApiRequestsController(IThirdPartyApiRequestService service) : ControllerBase
{

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
		IEnumerable<ThirdPartyApiRequestResponse> requests = await service.GetAllAsync(cancellationToken);
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
		ThirdPartyApiStatisticsResponse statistics = await service.GetStatisticsAsync(cancellationToken);
		return Ok(statistics);
	}
}