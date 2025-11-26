// <copyright file="ILogRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Logging;

/// <summary>
/// Repository interface for log operations.
/// </summary>
/// <remarks>
/// Defines the contract for data access operations on Log entities.
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
public interface ILogRepository
{
	/// <summary>
	/// Creates a new log entry.
	/// </summary>
	/// <param name="entity">The log entity to create.</param>
	/// <returns>The created entity with generated Id.</returns>
	/// <exception cref="ArgumentNullException">Thrown when entity is null.</exception>
	public Task<Log> CreateAsync(Log entity);

	/// <summary>
	/// Retrieves logs with filtering, searching, sorting, and pagination.
	/// </summary>
	/// <param name="request">The query request with filter, search, sort, and pagination parameters.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>Tuple containing collection of filtered log entries and total count.</returns>
	/// <remarks>
	/// Supports filtering by LogLevel, date range (StartDate/EndDate via Timestamp).
	/// Supports full-text search across Message, ExceptionMessage, SourceContext, RequestPath, and StackTrace.
	/// Supports sorting by any Log entity property (SortBy, SortDescending).
	/// Default sort: Timestamp descending (most recent first).
	/// Returns both data and total count for efficient pagination.
	/// </remarks>
	public Task<(IEnumerable<Log> Logs, int TotalCount)> GetPagedAsync(
		LogFilterRequest request,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Deletes logs older than the specified cutoff date.
	/// </summary>
	/// <param name="cutoffDate">Delete logs older than this date.</param>
	/// <returns>Number of logs deleted.</returns>
	/// <remarks>
	/// Used for log retention cleanup.
	/// Uses batch delete for performance.
	/// </remarks>
	public Task<int> DeleteOlderThanAsync(DateTime cutoffDate);

	/// <summary>
	/// Deletes a single log entry by its ID.
	/// </summary>
	/// <param name="id">The ID of the log to delete.</param>
	/// <returns>True if the log was found and deleted; false if not found.</returns>
	/// <remarks>
	/// Used for individual log deletion from the log management UI.
	/// Returns false if the log doesn't exist (already deleted or invalid ID).
	/// </remarks>
	public Task<bool> DeleteByIdAsync(int id);

	/// <summary>
	/// Deletes multiple log entries by their IDs in a single operation.
	/// </summary>
	/// <param name="ids">Array of log IDs to delete.</param>
	/// <returns>The number of logs successfully deleted.</returns>
	/// <remarks>
	/// Used for bulk deletion from the log management UI.
	/// Performs batch delete for better performance.
	/// Returns count of actually deleted logs (may be less than input if some IDs don't exist).
	/// </remarks>
	public Task<int> DeleteBatchAsync(int[] ids);
}
