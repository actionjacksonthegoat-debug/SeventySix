// <copyright file="IThirdPartyApiRequestRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ApiTracking;

/// <summary>Third-party API request tracking data access operations.</summary>
public interface IThirdPartyApiRequestRepository
{
	public Task<ThirdPartyApiRequest?> GetByApiNameAndDateAsync(
		string apiName,
		DateOnly resetDate,
		CancellationToken cancellationToken = default);

	public Task<ThirdPartyApiRequest> CreateAsync(
		ThirdPartyApiRequest entity,
		CancellationToken cancellationToken = default);

	public Task<ThirdPartyApiRequest> UpdateAsync(
		ThirdPartyApiRequest entity,
		CancellationToken cancellationToken = default);

	public Task<IEnumerable<ThirdPartyApiRequest>> GetByApiNameAsync(
		string apiName,
		CancellationToken cancellationToken = default);

	public Task<IEnumerable<ThirdPartyApiRequest>> GetAllAsync(
		CancellationToken cancellationToken = default);

	public Task<int> DeleteOlderThanAsync(
		DateOnly cutoffDate,
		CancellationToken cancellationToken = default);
}
