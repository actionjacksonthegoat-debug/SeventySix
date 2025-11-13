// <copyright file="ThirdPartyApiRequestService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Core.DTOs.ThirdPartyRequests;
using SeventySix.Core.Interfaces;

namespace SeventySix.BusinessLogic.Services;

/// <summary>
/// Service for third-party API request tracking operations.
/// </summary>
/// <remarks>
/// Provides business logic for retrieving and aggregating API request tracking data.
/// Follows SRP by handling only third-party API request business logic.
/// Follows DIP by depending on IThirdPartyApiRequestRepository abstraction.
/// </remarks>
public class ThirdPartyApiRequestService : IThirdPartyApiRequestService
{
	private readonly IThirdPartyApiRequestRepository Repository;

	/// <summary>
	/// Initializes a new instance of the <see cref="ThirdPartyApiRequestService"/> class.
	/// </summary>
	/// <param name="repository">The third-party API request repository.</param>
	public ThirdPartyApiRequestService(IThirdPartyApiRequestRepository repository)
	{
		this.Repository = repository ?? throw new ArgumentNullException(nameof(repository));
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<ThirdPartyApiRequestResponse>> GetAllAsync(CancellationToken cancellationToken)
	{
		var requests = await Repository.GetAllAsync(cancellationToken);

		return requests.Select(r => new ThirdPartyApiRequestResponse
		{
			Id = r.Id,
			ApiName = r.ApiName,
			BaseUrl = r.BaseUrl,
			CallCount = r.CallCount,
			LastCalledAt = r.LastCalledAt,
			ResetDate = r.ResetDate,
		});
	}

	/// <inheritdoc/>
	public async Task<ThirdPartyApiStatisticsResponse> GetStatisticsAsync(CancellationToken cancellationToken)
	{
		var requests = await Repository.GetAllAsync(cancellationToken);
		var requestList = requests.ToList();

		return new ThirdPartyApiStatisticsResponse
		{
			TotalCallsToday = requestList.Sum(r => r.CallCount),
			TotalApisTracked = requestList.Count,
			CallsByApi = requestList.ToDictionary(r => r.ApiName, r => r.CallCount),
			LastCalledByApi = requestList.ToDictionary(r => r.ApiName, r => r.LastCalledAt),
		};
	}
}