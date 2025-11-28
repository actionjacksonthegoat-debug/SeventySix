// <copyright file="IThirdPartyApiRequestService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ApiTracking;

/// <summary>Third-party API request tracking business logic operations.</summary>
public interface IThirdPartyApiRequestService
{
	Task<IEnumerable<ThirdPartyApiRequestResponse>> GetAllAsync(CancellationToken cancellationToken);

	Task<ThirdPartyApiStatisticsResponse> GetStatisticsAsync(CancellationToken cancellationToken);
}

