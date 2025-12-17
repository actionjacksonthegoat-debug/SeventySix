// <copyright file="ThirdPartyApiRequestService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ApiTracking;

/// <summary>
/// Service for third-party API request tracking operations.
/// </summary>
/// <remarks>
/// Provides business logic for retrieving and aggregating API request tracking data.
/// Follows SRP by handling only third-party API request business logic.
/// Follows DIP by depending on IThirdPartyApiRequestRepository abstraction.
/// </remarks>
/// <remarks>
/// Initializes a new instance of the <see cref="ThirdPartyApiRequestService"/> class.
/// </remarks>
/// <param name="repository">The third-party API request repository.</param>
public class ThirdPartyApiRequestService(
	IThirdPartyApiRequestRepository repository) : IThirdPartyApiRequestService
{
	/// <inheritdoc/>
	public string ContextName => "ApiTracking";

	/// <inheritdoc/>
	public async Task<bool> CheckHealthAsync(
		CancellationToken cancellationToken = default)
	{
		try
		{
			_ =
				await repository.GetAllAsync(cancellationToken);
			return true;
		}
		catch
		{
			return false;
		}
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<ThirdPartyApiRequestResponse>> GetAllAsync(
		CancellationToken cancellationToken)
	{
		IEnumerable<ThirdPartyApiRequest> requests =
			await repository.GetAllAsync(cancellationToken);

		return requests.Select(request => new ThirdPartyApiRequestResponse
		{
			Id = request.Id,
			ApiName = request.ApiName,
			BaseUrl = request.BaseUrl,
			CallCount = request.CallCount,
			LastCalledAt = request.LastCalledAt,
			ResetDate = request.ResetDate,
		});
	}

	/// <inheritdoc/>
	public async Task<ThirdPartyApiStatisticsResponse> GetStatisticsAsync(
		CancellationToken cancellationToken)
	{
		IEnumerable<ThirdPartyApiRequest> requests =
			await repository.GetAllAsync(cancellationToken);
		List<ThirdPartyApiRequest> requestList =
			[.. requests];

		return new ThirdPartyApiStatisticsResponse
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