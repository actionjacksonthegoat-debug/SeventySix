// <copyright file="LogService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using SeventySix.Shared;

namespace SeventySix.Logging;

/// <summary>
/// Log service implementation.
/// Encapsulates business logic for log operations.
/// </summary>
/// <remarks>
/// This service implements the Service Layer pattern, providing a facade over
/// the repository layer while handling business logic and validation.
///
/// Design Principles Applied:
/// - Single Responsibility Principle (SRP): Focuses only on log business logic
/// - Dependency Inversion Principle (DIP): Depends on abstractions (ILogRepository, IValidator)
/// - Open/Closed Principle (OCP): Open for extension via dependency injection, closed for modification
///
/// Responsibilities:
/// - Validate requests using FluentValidation
/// - Coordinate between repository and mapping layers
/// - Enforce business rules
/// - Map between domain entities and DTOs
///
/// Transaction Management: Relies on repository layer for data persistence.
/// Validation: Uses FluentValidation for request validation before processing.
/// </remarks>
/// <param name="repository">The repository for data access operations.</param>
/// <param name="filterValidator">The validator for filter requests.</param>
/// <exception cref="ArgumentNullException">
/// Thrown when any required dependency is null.
/// </exception>
public class LogService(
	ILogRepository repository,
	IValidator<LogFilterRequest> filterValidator) : ILogService
{
	/// <inheritdoc/>
	/// <exception cref="ValidationException">
	/// Thrown when the request fails validation rules defined in LogFilterRequestValidator.
	/// </exception>
	/// <remarks>
	/// Processing steps:
	/// 1. Validate request using FluentValidation (throws ValidationException if invalid)
	/// 2. Query repository with filters, search, sort, and pagination
	/// 3. Map entities to DTOs using extension method
	/// 4. Return paged result with metadata
	///
	/// The ValidateAndThrowAsync method ensures validation happens before any processing,
	/// following the fail-fast principle.
	/// </remarks>
	public async Task<PagedResult<LogResponse>> GetPagedLogsAsync(
		LogFilterRequest request,
		CancellationToken cancellationToken = default)
	{
		// Validate request
		await filterValidator.ValidateAndThrowAsync(request, cancellationToken);

		// Get paged data (repository returns both data and total count)
		(IEnumerable<Log> logs, int totalCount) = await repository.GetPagedAsync(
			request,
			cancellationToken);

		return new PagedResult<LogResponse>
		{
			Items = logs.ToDto().ToList(),
			Page = request.Page,
			PageSize = request.PageSize,
			TotalCount = totalCount
		};
	}

	/// <inheritdoc/>
	/// <exception cref="ValidationException">
	/// Thrown when the request fails validation rules.
	/// </exception>
	/// <remarks>
	/// Returns only the count without loading entities into memory.
	/// Uses same filters as GetPagedLogsAsync for consistency.
	/// </remarks>
	public async Task<int> GetLogsCountAsync(
		LogFilterRequest request,
		CancellationToken cancellationToken = default)
	{
		// Validate request
		await filterValidator.ValidateAndThrowAsync(request, cancellationToken);

		// Get count (efficient - no entity loading)
		(_, int totalCount) = await repository.GetPagedAsync(
			request,
			cancellationToken);

		return totalCount;
	}

	/// <inheritdoc/>
	/// <remarks>
	/// Returns false if the log doesn't exist, allowing the caller to determine
	/// the appropriate response (typically 404 Not Found).
	/// </remarks>
	public async Task<bool> DeleteLogByIdAsync(int id, CancellationToken cancellationToken = default)
	{
		return await repository.DeleteByIdAsync(id, cancellationToken);
	}

	/// <inheritdoc/>
	/// <remarks>
	/// Performs batch delete for better performance.
	/// Returns count of actually deleted logs (may be less than input if some IDs don't exist).
	/// </remarks>
	public async Task<int> DeleteLogsBatchAsync(int[] ids, CancellationToken cancellationToken = default)
	{
		return await repository.DeleteBatchAsync(ids, cancellationToken);
	}

	/// <inheritdoc/>
	/// <remarks>
	/// Used for log retention cleanup.
	/// Deletes all logs with Timestamp older than the specified cutoff date.
	/// </remarks>
	public async Task<int> DeleteLogsOlderThanAsync(DateTime cutoffDate, CancellationToken cancellationToken = default)
	{
		return await repository.DeleteOlderThanAsync(cutoffDate, cancellationToken);
	}

	/// <inheritdoc/>
	/// <remarks>
	/// Performs a minimal query to verify database connectivity.
	/// Returns true if the query succeeds, false if any exception occurs.
	/// </remarks>
	public async Task<bool> CheckDatabaseHealthAsync(CancellationToken cancellationToken = default)
	{
		try
		{
			// Simple connectivity check - minimal query with Page=1, PageSize=1
			LogFilterRequest healthCheckRequest = new() { Page = 1, PageSize = 1 };
			_ = await repository.GetPagedAsync(healthCheckRequest, cancellationToken);
			return true;
		}
		catch
		{
			return false;
		}
	}
}
