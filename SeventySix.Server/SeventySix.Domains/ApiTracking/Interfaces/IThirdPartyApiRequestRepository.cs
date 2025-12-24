// <copyright file="IThirdPartyApiRequestRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ApiTracking;

/// <summary>
/// Contract for third-party API request tracking data access operations.
/// </summary>
public interface IThirdPartyApiRequestRepository
{
	/// <summary>
	/// Retrieves a <see cref="ThirdPartyApiRequest"/> for the specified API name and reset date, or null if not found.
	/// </summary>
	/// <param name="apiName">
	/// The external API name to search for.
	/// </param>
	/// <param name="resetDate">
	/// The date for which the counter is tracked.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// The matching <see cref="ThirdPartyApiRequest"/> or <c>null</c> if none found.
	/// </returns>
	public Task<ThirdPartyApiRequest?> GetByApiNameAndDateAsync(
		string apiName,
		DateOnly resetDate,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Creates a new ThirdPartyApiRequest record.
	/// </summary>
	/// <param name="entity">
	/// The entity to create.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	public Task<ThirdPartyApiRequest> CreateAsync(
		ThirdPartyApiRequest entity,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Updates an existing ThirdPartyApiRequest record.
	/// </summary>
	/// <param name="entity">
	/// The entity with updated values.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	public Task<ThirdPartyApiRequest> UpdateAsync(
		ThirdPartyApiRequest entity,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Retrieves all ThirdPartyApiRequest records for the specified API name, ordered by reset date descending.
	/// </summary>
	/// <param name="apiName">
	/// The external API name to filter by.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	public Task<IEnumerable<ThirdPartyApiRequest>> GetByApiNameAsync(
		string apiName,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Retrieves all ThirdPartyApiRequest records.
	/// </summary>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	public Task<IEnumerable<ThirdPartyApiRequest>> GetAllAsync(
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Deletes ThirdPartyApiRequest records older than the provided cutoff date and returns the deleted count.
	/// </summary>
	/// <param name="cutoffDate">
	/// The exclusive cutoff date; records with ResetDate &lt; cutoff are deleted.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	public Task<int> DeleteOlderThanAsync(
		DateOnly cutoffDate,
		CancellationToken cancellationToken = default);
}