// <copyright file="ThirdPartyApiRequestsController.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using SeventySix.Api.Configuration;
using SeventySix.ApiTracking;
using SeventySix.Identity.Constants;
using Wolverine;

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
/// <param name="messageBus">
/// The Wolverine message bus for executing queries.
/// </param>
[ApiController]
[Authorize(Policy = PolicyConstants.AdminOnly)]
[Route(ApiVersionConfig.VersionedRoutePrefix + "/thirdpartyrequests")]
public class ThirdPartyApiRequestsController(IMessageBus messageBus)
	: ControllerBase
{
	/// <summary>
	/// Retrieves all third-party API request tracking records.
	/// </summary>
	/// <param name="cancellationToken">
	/// Cancellation token for the async operation.
	/// </param>
	/// <returns>
	/// A list of API request tracking records.
	/// </returns>
	/// <response code="200">Returns the list of API request records.</response>
	[HttpGet]
	[ProducesResponseType(
		typeof(IEnumerable<ThirdPartyApiRequestDto>),
		StatusCodes.Status200OK
	)]
	[OutputCache(PolicyName = CachePolicyConstants.ThirdPartyRequests)]
	public async Task<
		ActionResult<IEnumerable<ThirdPartyApiRequestDto>>
	> GetAllAsync(CancellationToken cancellationToken)
	{
		IEnumerable<ThirdPartyApiRequestDto> requests =
			await messageBus.InvokeAsync<IEnumerable<ThirdPartyApiRequestDto>>(
				new GetAllApiRequestsQuery(),
				cancellationToken);

		return Ok(requests);
	}

	/// <summary>
	/// Retrieves aggregated statistics for third-party API requests.
	/// </summary>
	/// <param name="cancellationToken">
	/// Cancellation token for the async operation.
	/// </param>
	/// <returns>
	/// Aggregated API request statistics.
	/// </returns>
	/// <response code="200">Returns the aggregated statistics.</response>
	[HttpGet("statistics")]
	[ProducesResponseType(
		typeof(ThirdPartyApiStatisticsDto),
		StatusCodes.Status200OK
	)]
	[OutputCache(PolicyName = CachePolicyConstants.ThirdPartyRequests)]
	public async Task<
		ActionResult<ThirdPartyApiStatisticsDto>
	> GetStatisticsAsync(CancellationToken cancellationToken)
	{
		ThirdPartyApiStatisticsDto statistics =
			await messageBus.InvokeAsync<ThirdPartyApiStatisticsDto>(
				new GetApiRequestStatisticsQuery(),
				cancellationToken);

		return Ok(statistics);
	}
}