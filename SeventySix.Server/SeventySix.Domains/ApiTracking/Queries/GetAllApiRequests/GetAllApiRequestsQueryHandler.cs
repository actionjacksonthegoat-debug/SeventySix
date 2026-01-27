// <copyright file="GetAllApiRequestsQueryHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ApiTracking;

/// <summary>
/// Handler for GetAllApiRequestsQuery to retrieve all API request tracking records.
/// </summary>
public static class GetAllApiRequestsQueryHandler
{
	/// <summary>
	/// Handles the query to retrieve all third-party API request tracking records.
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
	/// Collection of API request response DTOs.
	/// </returns>
	public static async Task<IEnumerable<ThirdPartyApiRequestDto>> HandleAsync(
		GetAllApiRequestsQuery query,
		IThirdPartyApiRequestRepository repository,
		CancellationToken cancellationToken)
	{
		IEnumerable<ThirdPartyApiRequest> requests =
			await repository.GetAllAsync(cancellationToken);

		return requests.Select(request => new ThirdPartyApiRequestDto
		{
			Id = request.Id,
			ApiName = request.ApiName,
			BaseUrl = request.BaseUrl,
			CallCount = request.CallCount,
			LastCalledAt = request.LastCalledAt,
			ResetDate = request.ResetDate,
		});
	}
}