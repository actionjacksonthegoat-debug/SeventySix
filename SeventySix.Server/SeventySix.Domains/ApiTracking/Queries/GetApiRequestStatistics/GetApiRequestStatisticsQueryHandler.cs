// <copyright file="GetApiRequestStatisticsQueryHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ApiTracking;

/// <summary>
/// Handler for GetApiRequestStatisticsQuery to retrieve aggregated API request statistics.
/// </summary>
public static class GetApiRequestStatisticsQueryHandler
{
	/// <summary>
	/// Handles the query to retrieve aggregated statistics for third-party API requests.
	/// </summary>
	/// <param name="query">
	/// The query containing no parameters.
	/// </param>
	/// <param name="repository">
	/// The repository for accessing API request data.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// Aggregated API request statistics.
	/// </returns>
	public static async Task<ThirdPartyApiStatisticsDto> HandleAsync(
		GetApiRequestStatisticsQuery query,
		IThirdPartyApiRequestRepository repository,
		CancellationToken cancellationToken)
	{
		IEnumerable<ThirdPartyApiRequest> requests =
			await repository.GetAllAsync(cancellationToken);

		List<ThirdPartyApiRequest> requestList =
			[.. requests];

		return new ThirdPartyApiStatisticsDto
		{
			TotalCallsToday =
				requestList.Sum(request => request.CallCount),
			TotalApisTracked = requestList.Count,
			CallsByApi =
				requestList.ToDictionary(
					request => request.ApiName,
					request => request.CallCount),
			LastCalledByApi =
				requestList.ToDictionary(
					request => request.ApiName,
					request => request.LastCalledAt),
		};
	}
}