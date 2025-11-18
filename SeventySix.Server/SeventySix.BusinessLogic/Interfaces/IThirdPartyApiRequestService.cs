// <copyright file="IThirdPartyApiRequestService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.BusinessLogic.DTOs.ThirdPartyRequests;

namespace SeventySix.BusinessLogic.Interfaces;

/// <summary>
/// Service interface for third-party API request tracking operations.
/// </summary>
/// <remarks>
/// Provides methods to retrieve API request tracking data and statistics.
/// Follows ISP by defining only third-party API request operations.
/// </remarks>
public interface IThirdPartyApiRequestService
{
	/// <summary>
	/// Retrieves all third-party API request tracking records.
	/// </summary>
	/// <param name="cancellationToken">Cancellation token for the async operation.</param>
	/// <returns>A collection of API request tracking records.</returns>
	public Task<IEnumerable<ThirdPartyApiRequestResponse>> GetAllAsync(CancellationToken cancellationToken);

	/// <summary>
	/// Retrieves aggregated statistics for third-party API requests.
	/// </summary>
	/// <param name="cancellationToken">Cancellation token for the async operation.</param>
	/// <returns>Aggregated API request statistics.</returns>
	public Task<ThirdPartyApiStatisticsResponse> GetStatisticsAsync(CancellationToken cancellationToken);
}