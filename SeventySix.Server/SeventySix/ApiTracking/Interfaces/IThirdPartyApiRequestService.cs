// <copyright file="IThirdPartyApiRequestService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ApiTracking;

/// <summary>Third-party API request tracking business logic operations.</summary>
public interface IThirdPartyApiRequestService
{
	public Task<IEnumerable<ThirdPartyApiRequestResponse>> GetAllAsync(CancellationToken cancellationToken);

	public Task<ThirdPartyApiStatisticsResponse> GetStatisticsAsync(CancellationToken cancellationToken);
}