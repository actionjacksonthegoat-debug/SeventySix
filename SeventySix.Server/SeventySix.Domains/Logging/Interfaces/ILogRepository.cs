// <copyright file="ILogRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Logging;

/// <summary>
/// Log data access operations.
/// </summary>
public interface ILogRepository
{
	/// <summary>
	/// Creates a new <see cref="Log"/> record.
	/// </summary>
	/// <param name="entity">
	/// The log entity to create.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// The created <see cref="Log"/> entity with identifier.
	/// </returns>
	public Task<Log> CreateAsync(
		Log entity,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Retrieves paged log records based on the provided query.
	/// </summary>
	/// <param name="request">
	/// The pagination and filter criteria.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// A tuple containing the collection of logs and the total count.
	/// </returns>
	public Task<(IEnumerable<Log> Logs, int TotalCount)> GetPagedAsync(
		LogQueryRequest request,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Deletes logs older than the specified cutoff date.
	/// </summary>
	/// <param name="cutoffDate">
	/// The exclusive cutoff date; logs with CreateDate &lt; cutoff are deleted.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// The number of deleted records.
	/// </returns>
	public Task<int> DeleteOlderThanAsync(
		DateTime cutoffDate,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Deletes a log by its identifier.
	/// </summary>
	/// <param name="id">
	/// The log identifier.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// True if deletion succeeded, otherwise false.
	/// </returns>
	public Task<bool> DeleteByIdAsync(
		long id,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Deletes multiple logs by their identifiers.
	/// </summary>
	/// <param name="ids">
	/// Array of log identifiers to delete.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// The number of logs deleted.
	/// </returns>
	public Task<int> DeleteBatchAsync(
		long[] ids,
		CancellationToken cancellationToken = default);
}