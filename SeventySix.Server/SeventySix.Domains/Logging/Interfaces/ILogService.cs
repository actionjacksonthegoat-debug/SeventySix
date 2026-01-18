// <copyright file="ILogService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Interfaces;
using SeventySix.Shared.POCOs;

namespace SeventySix.Logging;

/// <summary>
/// Log business logic operations.
/// </summary>
public interface ILogService : IDatabaseHealthCheck
{
	/// <summary>
	/// Retrieves paginated log entries based on filters.
	/// </summary>
	/// <param name="request">
	/// The pagination and filter criteria.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// A <see cref="PagedResult{LogDto}"/> containing the matched logs.
	/// </returns>
	public Task<PagedResult<LogDto>> GetPagedLogsAsync(
		LogQueryRequest request,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Deletes a log entry by its identifier.
	/// </summary>
	/// <param name="id">
	/// The log identifier.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// True if the log was deleted, false if not found.
	/// </returns>
	public Task<bool> DeleteLogByIdAsync(
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
	public Task<int> DeleteLogsBatchAsync(
		long[] ids,
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
	/// The number of logs deleted.
	/// </returns>
	public Task<int> DeleteLogsOlderThanAsync(
		DateTime cutoffDate,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Creates a single client-provided log entry.
	/// </summary>
	/// <param name="request">
	/// The client log request payload.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	public Task CreateClientLogAsync(
		CreateLogRequest request,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Creates multiple client-provided log entries in a batch.
	/// </summary>
	/// <param name="requests">
	/// Array of client log request payloads.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	public Task CreateClientLogBatchAsync(
		CreateLogRequest[] requests,
		CancellationToken cancellationToken = default);
}