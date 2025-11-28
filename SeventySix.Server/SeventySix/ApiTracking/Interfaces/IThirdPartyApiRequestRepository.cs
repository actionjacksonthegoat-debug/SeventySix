// <copyright file="IThirdPartyApiRequestRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ApiTracking;

/// <summary>Third-party API request tracking data access operations.</summary>
public interface IThirdPartyApiRequestRepository
{
	Task<ThirdPartyApiRequest?> GetByApiNameAndDateAsync(
		string apiName,
		DateOnly resetDate,
		CancellationToken cancellationToken = default);

	Task<ThirdPartyApiRequest> CreateAsync(ThirdPartyApiRequest entity, CancellationToken cancellationToken = default);

	Task<ThirdPartyApiRequest> UpdateAsync(ThirdPartyApiRequest entity, CancellationToken cancellationToken = default);

	Task<IEnumerable<ThirdPartyApiRequest>> GetByApiNameAsync(
		string apiName,
		CancellationToken cancellationToken = default);

	Task<IEnumerable<ThirdPartyApiRequest>> GetAllAsync(CancellationToken cancellationToken = default);

	Task<int> DeleteOlderThanAsync(DateOnly cutoffDate, CancellationToken cancellationToken = default);
}

