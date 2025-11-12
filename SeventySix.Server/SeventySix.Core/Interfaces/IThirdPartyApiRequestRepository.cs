// <copyright file="IThirdPartyApiRequestRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Core.Entities;

namespace SeventySix.Core.Interfaces;

/// <summary>
/// Repository interface for third-party API request tracking operations.
/// </summary>
/// <remarks>
/// Defines the contract for data access operations on ThirdPartyApiRequest entities.
/// Follows Repository Pattern and Dependency Inversion Principle (DIP).
///
/// Design Patterns:
/// - Repository: Abstracts data access logic
/// - Dependency Inversion: Core layer defines interface, DataAccess implements
///
/// SOLID Principles:
/// - ISP: Focused interface with only necessary operations
/// - DIP: Depends on abstraction, not concrete implementation
/// - OCP: Can add new implementations without modifying interface
/// </remarks>
public interface IThirdPartyApiRequestRepository
{
	/// <summary>
	/// Retrieves a tracking record for a specific API on a specific date.
	/// </summary>
	/// <param name="apiName">The name of the API (e.g., "OpenWeather").</param>
	/// <param name="resetDate">The date for the tracking record.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>The tracking record if found; otherwise, null.</returns>
	/// <remarks>
	/// This is the most common query operation for rate limiting.
	/// Should use composite index on (ApiName, ResetDate) for optimal performance.
	/// </remarks>
	public Task<ThirdPartyApiRequest?> GetByApiNameAndDateAsync(
		string apiName,
		DateOnly resetDate,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Creates a new tracking record.
	/// </summary>
	/// <param name="entity">The entity to create.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>The created entity with generated Id.</returns>
	/// <exception cref="ArgumentNullException">Thrown when entity is null.</exception>
	/// <exception cref="InvalidOperationException">Thrown when unique constraint is violated.</exception>
	/// <remarks>
	/// Enforces unique constraint: one record per (ApiName, ResetDate) combination.
	/// Sets CreatedAt and UpdatedAt timestamps automatically via DbContext.
	/// </remarks>
	public Task<ThirdPartyApiRequest> CreateAsync(
		ThirdPartyApiRequest entity,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Updates an existing tracking record.
	/// </summary>
	/// <param name="entity">The entity to update.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>The updated entity.</returns>
	/// <exception cref="ArgumentNullException">Thrown when entity is null.</exception>
	/// <exception cref="InvalidOperationException">Thrown when entity not found or concurrency conflict.</exception>
	/// <remarks>
	/// Updates UpdatedAt timestamp automatically via DbContext.
	/// Used primarily for incrementing CallCount.
	/// </remarks>
	public Task<ThirdPartyApiRequest> UpdateAsync(
		ThirdPartyApiRequest entity,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Retrieves all tracking records for a specific API.
	/// </summary>
	/// <param name="apiName">The name of the API.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>Collection of tracking records for the specified API.</returns>
	/// <remarks>
	/// Used for analytics and reporting.
	/// Returns records ordered by ResetDate descending (most recent first).
	/// </remarks>
	public Task<IEnumerable<ThirdPartyApiRequest>> GetByApiNameAsync(
		string apiName,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Deletes tracking records older than the specified cutoff date.
	/// </summary>
	/// <param name="cutoffDate">Delete records with ResetDate before this date.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>The number of records deleted.</returns>
	/// <remarks>
	/// Used for data retention policies (e.g., keep only last 30 days).
	/// Performs batch delete for efficiency.
	/// </remarks>
	public Task<int> DeleteOlderThanAsync(
		DateOnly cutoffDate,
		CancellationToken cancellationToken = default);
}