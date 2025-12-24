// <copyright file="IThirdPartyApiRequestService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Interfaces;

namespace SeventySix.ApiTracking;

/// <summary>
/// Contract for third-party API request tracking operations.
/// </summary>
public interface IThirdPartyApiRequestService : IDatabaseHealthCheck
{
	/// <summary>
	/// Retrieves all third-party API request tracking records.
	/// </summary>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// Collection of <see cref="ThirdPartyApiRequestResponse"/> records.
	/// </returns>
	public Task<IEnumerable<ThirdPartyApiRequestResponse>> GetAllAsync(
		CancellationToken cancellationToken);

	/// <summary>
	/// Retrieves aggregated statistics for third-party API requests.
	/// </summary>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// A <see cref="ThirdPartyApiStatisticsResponse"/> containing aggregated metrics.
	/// </returns>
	public Task<ThirdPartyApiStatisticsResponse> GetStatisticsAsync(
		CancellationToken cancellationToken);
}