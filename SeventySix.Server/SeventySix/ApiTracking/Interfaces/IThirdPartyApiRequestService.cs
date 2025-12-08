// <copyright file="IThirdPartyApiRequestService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared;

namespace SeventySix.ApiTracking;

/// <summary>Third-party API request tracking business logic operations.</summary>
public interface IThirdPartyApiRequestService : IDatabaseHealthCheck
{
	public Task<IEnumerable<ThirdPartyApiRequestResponse>> GetAllAsync(CancellationToken cancellationToken);

	public Task<ThirdPartyApiStatisticsResponse> GetStatisticsAsync(CancellationToken cancellationToken);
}