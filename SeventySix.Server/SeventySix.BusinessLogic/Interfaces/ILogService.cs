// <copyright file="ILogService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.BusinessLogic.DTOs;
using SeventySix.BusinessLogic.DTOs.Logs;

namespace SeventySix.BusinessLogic.Interfaces;

/// <summary>
/// Log service interface.
/// Defines the contract for business logic operations related to logs.
/// </summary>
/// <remarks>
/// This interface follows the Interface Segregation Principle (ISP) by defining
/// only the operations needed for log management.
///
/// It serves as an abstraction layer (Dependency Inversion Principle) between
/// the API layer and the business logic implementation, allowing for:
/// - Easy testing through mocking
/// - Multiple implementations (e.g., caching decorator)
/// - Loose coupling between layers
///
/// All methods are async to support scalable I/O operations.
/// </remarks>
public interface ILogService
{
	/// <summary>
	/// Retrieves logs with filtering, searching, sorting, and pagination.
	/// </summary>
	/// <param name="request">The query request with filter, search, sort, and pagination parameters.</param>
	/// <param name="cancellationToken">Token to cancel the operation if needed.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result contains paged results with items and pagination metadata.
	/// </returns>
	/// <exception cref="ValidationException">
	/// Thrown when the request fails FluentValidation rules.
	/// </exception>
	/// <remarks>
	/// Supports filtering by LogLevel, date range (StartDate/EndDate).
	/// Supports full-text search across Message, ExceptionMessage, SourceContext, RequestPath, and StackTrace.
	/// Supports sorting by any Log entity property (validated via reflection).
	/// Default sort: Timestamp descending (most recent first).
	/// Maximum date range: 90 days (enforced by validator).
	/// </remarks>
	public Task<PagedResult<LogResponse>> GetPagedLogsAsync(LogFilterRequest request, CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets the total count of logs matching the filter criteria.
	/// </summary>
	/// <param name="request">The query request with filter parameters.</param>
	/// <param name="cancellationToken">Token to cancel the operation if needed.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result contains the total count of matching logs.
	/// </returns>
	/// <remarks>
	/// Used for statistics and pagination calculations.
	/// Applies same filters as GetPagedLogsAsync but returns only count.
	/// </remarks>
	public Task<int> GetLogsCountAsync(LogFilterRequest request, CancellationToken cancellationToken = default);

	/// <summary>
	/// Deletes a single log entry by its ID.
	/// </summary>
	/// <param name="id">The ID of the log to delete.</param>
	/// <param name="cancellationToken">Token to cancel the operation if needed.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result is true if the log was found and deleted; false if not found.
	/// </returns>
	/// <remarks>
	/// Used for individual log deletion from the log management UI.
	/// Returns false if the log doesn't exist (already deleted or invalid ID).
	/// </remarks>
	public Task<bool> DeleteLogByIdAsync(int id, CancellationToken cancellationToken = default);

	/// <summary>
	/// Deletes multiple log entries by their IDs in a single operation.
	/// </summary>
	/// <param name="ids">Array of log IDs to delete.</param>
	/// <param name="cancellationToken">Token to cancel the operation if needed.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result contains the number of logs successfully deleted.
	/// </returns>
	/// <remarks>
	/// Used for bulk deletion from the log management UI.
	/// Performs batch delete for better performance.
	/// Returns count of actually deleted logs (may be less than input if some IDs don't exist).
	/// </remarks>
	public Task<int> DeleteLogsBatchAsync(int[] ids, CancellationToken cancellationToken = default);

	/// <summary>
	/// Deletes logs older than the specified cutoff date.
	/// </summary>
	/// <param name="cutoffDate">Delete logs older than this date.</param>
	/// <param name="cancellationToken">Token to cancel the operation if needed.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result contains the number of logs deleted.
	/// </returns>
	/// <remarks>
	/// Used for log retention cleanup.
	/// Uses batch delete for performance.
	/// </remarks>
	public Task<int> DeleteLogsOlderThanAsync(DateTime cutoffDate, CancellationToken cancellationToken = default);
}
