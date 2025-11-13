// <copyright file="ILogRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Core.Entities;

namespace SeventySix.Core.Interfaces;

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
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>The created entity with generated Id.</returns>
	/// <exception cref="ArgumentNullException">Thrown when entity is null.</exception>
	public Task<Log> CreateAsync(Log entity, CancellationToken cancellationToken = default);

	/// <summary>
	/// Retrieves logs with optional filtering.
	/// </summary>
	/// <param name="logLevel">Optional log level filter.</param>
	/// <param name="startDate">Optional start date filter.</param>
	/// <param name="endDate">Optional end date filter.</param>
	/// <param name="sourceContext">Optional source context filter.</param>
	/// <param name="requestPath">Optional request path filter.</param>
	/// <param name="skip">Number of records to skip.</param>
	/// <param name="take">Number of records to take.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>Collection of filtered log entries.</returns>
	/// <remarks>
	/// Returns logs ordered by Timestamp descending (most recent first).
	/// Maximum of 1000 records per query for performance.
	/// </remarks>
	public Task<IEnumerable<Log>> GetLogsAsync(
		string? logLevel = null,
		DateTime? startDate = null,
		DateTime? endDate = null,
		string? sourceContext = null,
		string? requestPath = null,
		int skip = 0,
		int take = 100,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets the total count of logs matching the filter criteria.
	/// </summary>
	/// <param name="logLevel">Optional log level filter.</param>
	/// <param name="startDate">Optional start date filter.</param>
	/// <param name="endDate">Optional end date filter.</param>
	/// <param name="sourceContext">Optional source context filter.</param>
	/// <param name="requestPath">Optional request path filter.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>Total count of matching logs.</returns>
	/// <remarks>
	/// Use in conjunction with GetLogsAsync for pagination.
	/// </remarks>
	public Task<int> GetLogsCountAsync(
		string? logLevel = null,
		DateTime? startDate = null,
		DateTime? endDate = null,
		string? sourceContext = null,
		string? requestPath = null,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Deletes logs older than the specified cutoff date.
	/// </summary>
	/// <param name="cutoffDate">Delete logs older than this date.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>Number of logs deleted.</returns>
	/// <remarks>
	/// Used for log retention cleanup.
	/// Uses batch delete for performance.
	/// </remarks>
	public Task<int> DeleteOlderThanAsync(DateTime cutoffDate, CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets log statistics for dashboard.
	/// </summary>
	/// <param name="startDate">Start date for statistics.</param>
	/// <param name="endDate">End date for statistics.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>Log statistics including counts by level, avg response times, etc.</returns>
	/// <remarks>
	/// Provides aggregated data for monitoring dashboard.
	/// Includes error counts, request metrics, and top error sources.
	/// </remarks>
	public Task<LogStatistics> GetStatisticsAsync(
		DateTime startDate,
		DateTime endDate,
		CancellationToken cancellationToken = default);
}