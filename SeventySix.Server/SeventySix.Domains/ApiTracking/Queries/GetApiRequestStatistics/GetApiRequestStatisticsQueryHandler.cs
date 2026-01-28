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
	/// <param name="timeProvider">
	/// Time provider for getting today's date.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// Aggregated API request statistics for today.
	/// </returns>
	public static async Task<ThirdPartyApiStatisticsDto> HandleAsync(
		GetApiRequestStatisticsQuery query,
		IThirdPartyApiRequestRepository repository,
		TimeProvider timeProvider,
		CancellationToken cancellationToken)
	{
		DateOnly today =
			DateOnly.FromDateTime(timeProvider.GetUtcNow().UtcDateTime);

		return await repository.GetStatisticsAsync(today, cancellationToken);
	}
}