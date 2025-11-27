// <copyright file="LogsController.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using SeventySix.Api.Attributes;
using SeventySix.Api.Configuration;
using SeventySix.Logging;
using SeventySix.Shared;

namespace SeventySix.Api.Controllers;

/// <summary>
/// API controller for managing and retrieving system logs.
/// </summary>
/// <remarks>
/// Provides endpoints for:
/// - Querying logs with filters and pagination
/// - Client-side error logging
/// - Cleaning up old logs
///
/// Design Patterns:
/// - RESTful API with resource-based endpoints
/// - Service layer pattern for business logic
/// - DTO pattern for request/response models
///
/// SOLID Principles:
/// - SRP: Only responsible for HTTP API layer for logs
/// - DIP: Depends on ILogService abstraction
/// - OCP: Extensible for additional endpoints
/// </remarks>
/// <remarks>
/// Initializes a new instance of the <see cref="LogsController"/> class.
/// </remarks>
/// <param name="logService">The log service.</param>
/// <param name="logger">The logger.</param>
/// <param name="outputCacheStore">The output cache store.</param>
[ApiController]
[Route(ApiVersionConfig.VersionedRoutePrefix + "/logs")]
[RateLimit()] // 250 req/hour (default)
public class LogsController(
	ILogService logService,
	ILogger<LogsController> logger,
	IOutputCacheStore outputCacheStore) : ControllerBase
{
	/// <summary>
	/// Gets logs with filtering, searching, sorting, and pagination.
	/// </summary>
	/// <param name="request">The filter, search, sort, and pagination parameters.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>A paginated list of logs matching the filter criteria.</returns>
	/// <response code="200">Returns the filtered list of logs with pagination metadata.</response>
	/// <response code="400">If the request parameters are invalid.</response>
	/// <remarks>
	/// This endpoint uses output caching with tag-based invalidation.
	/// Cache is automatically cleared when logs are created or deleted.
	///
	/// Filtering Options:
	/// - LogLevel: Filter by severity (Error, Warning, etc.)
	/// - SearchTerm: Full-text search across Message, ExceptionMessage, SourceContext, RequestPath, and StackTrace (3-200 chars)
	/// - DateRange: Filter by timestamp (StartDate/EndDate, max 90 days)
	/// - Sorting: SortBy property name, SortDescending (default: Timestamp descending)
	/// - Pagination: Page (default 1), PageSize (default 50, max 100)
	///
	/// Security Validation:
	/// - SearchTerm: 3-200 characters to prevent abuse
	/// - DateRange: Limited to 90 days to protect database performance
	/// - PageSize: Capped at 100 records to prevent resource exhaustion
	/// - SortBy: Validated against Log entity properties via reflection
	/// </remarks>
	[HttpGet]
	[OutputCache(PolicyName = "logs")]
	[ProducesResponseType(typeof(PagedLogResponse), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	public async Task<ActionResult<PagedLogResponse>> GetPagedAsync(
		[FromQuery] LogFilterRequest request,
		CancellationToken cancellationToken = default)
	{
		try
		{
			// Service layer handles validation and business logic
			PagedResult<LogResponse> result = await logService.GetPagedLogsAsync(request, cancellationToken);

			PagedLogResponse response = new()
			{
				Data = result.Items.ToList(),
				TotalCount = result.TotalCount,
				PageNumber = result.Page,
				PageSize = result.PageSize,
			};

			return Ok(response);
		}
		catch (FluentValidation.ValidationException ex)
		{
			// Return validation errors as BadRequest
			return BadRequest(ex.Errors);
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Error retrieving logs");
			return StatusCode(StatusCodes.Status500InternalServerError, "Error retrieving logs");
		}
	}

	/// <summary>
	/// Gets the total count of logs matching the filter criteria.
	/// </summary>
	/// <param name="request">The filter parameters.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>The total count of logs.</returns>
	/// <response code="200">Returns the total log count.</response>
	/// <response code="400">If the request parameters are invalid.</response>
	/// <response code="500">If an error occurs while retrieving the count.</response>
	[HttpGet("count")]
	[OutputCache(PolicyName = "logs")]
	[ProducesResponseType(typeof(LogCountResponse), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<ActionResult<LogCountResponse>> GetCountAsync(
		[FromQuery] LogFilterRequest request,
		CancellationToken cancellationToken = default)
	{
		try
		{
			// Service layer handles validation
			int count = await logService.GetLogsCountAsync(request, cancellationToken);

			return Ok(new LogCountResponse { Total = count });
		}
		catch (FluentValidation.ValidationException ex)
		{
			return BadRequest(ex.Errors);
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Error retrieving log count");
			return StatusCode(StatusCodes.Status500InternalServerError, "Error retrieving log count");
		}
	}

	/// <summary>
	/// Deletes a single log entry by ID.
	/// </summary>
	/// <param name="id">The ID of the log to delete.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>No content if successful; not found if log doesn't exist.</returns>
	/// <response code="204">Log successfully deleted.</response>
	/// <response code="404">Log with specified ID not found.</response>
	/// <response code="500">If an error occurs while deleting the log.</response>
	[HttpDelete("{id}")]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<IActionResult> DeleteLogAsync(int id, CancellationToken cancellationToken = default)
	{
		try
		{
			bool deleted = await logService.DeleteLogByIdAsync(id, cancellationToken);

			if (!deleted)
			{
				return NotFound();
			}

			// Invalidate logs cache after deletion
			await outputCacheStore.EvictByTagAsync("logs", cancellationToken);

			return NoContent();
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Error deleting log with ID: {LogId}", id);
			return StatusCode(StatusCodes.Status500InternalServerError, "Error deleting log");
		}
	}

	/// <summary>
	/// Deletes multiple log entries in a single batch operation.
	/// </summary>
	/// <param name="ids">Array of log IDs to delete.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>The number of logs successfully deleted.</returns>
	/// <response code="200">Returns the count of deleted logs.</response>
	/// <response code="400">If no log IDs are provided.</response>
	/// <response code="500">If an error occurs while deleting logs.</response>
	[HttpDelete("batch")]
	[ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<ActionResult<int>> DeleteLogBatchAsync(
		[FromBody] int[] ids,
		CancellationToken cancellationToken = default)
	{
		if (ids == null || ids.Length == 0)
		{
			return BadRequest("No log IDs provided");
		}

		try
		{
			int deletedCount = await logService.DeleteLogsBatchAsync(ids, cancellationToken);

			// Invalidate logs cache after batch deletion
			await outputCacheStore.EvictByTagAsync("logs", cancellationToken);

			return Ok(deletedCount);
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Error bulk deleting logs. Count: {Count}, IDs: {Ids}",
				ids.Length, string.Join(", ", ids.Take(10))); // Log first 10 IDs
			return StatusCode(StatusCodes.Status500InternalServerError, "Error bulk deleting logs");
		}
	}

	/// <summary>
	/// Deletes logs older than the specified cutoff date.
	/// </summary>
	/// <param name="cutoffDate">The cutoff date. Logs older than this date will be deleted.</param>
	/// <returns>The number of deleted logs.</returns>
	/// <response code="200">Returns the number of deleted logs.</response>
	/// <response code="400">If the cutoff date is not provided or invalid.</response>
	/// <response code="500">If an error occurs while deleting logs.</response>
	[HttpDelete("cleanup")]
	[ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<ActionResult<int>> CleanupLogsAsync(
		[FromQuery] DateTime? cutoffDate,
		CancellationToken cancellationToken = default)
	{
		if (!cutoffDate.HasValue)
		{
			return BadRequest("Cutoff date is required");
		}

		try
		{
			int deletedCount = await logService.DeleteLogsOlderThanAsync(cutoffDate.Value, cancellationToken);

			// Invalidate logs cache after cleanup
			await outputCacheStore.EvictByTagAsync("logs", cancellationToken);

			return Ok(deletedCount);
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Error during log cleanup");
			return StatusCode(StatusCodes.Status500InternalServerError, "Error during log cleanup");
		}
	}

	/// <summary>
	/// Receives and stores client-side error logs.
	/// </summary>
	/// <param name="request">The client log data.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>No content on success.</returns>
	/// <response code="204">Log successfully recorded.</response>
	/// <response code="400">Invalid request data.</response>
	/// <response code="500">If an error occurs while logging the client error.</response>
	[HttpPost("client")]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<IActionResult> LogClientErrorAsync(
		[FromBody] ClientLogRequest request,
		CancellationToken cancellationToken = default)
	{
		try
		{
			await logService.CreateClientLogAsync(request, cancellationToken);

			// Invalidate logs cache after creating new log
			await outputCacheStore.EvictByTagAsync("logs", cancellationToken);

			return NoContent();
		}
		catch (Exception ex)
		{
			// Don't throw - we don't want to cause errors when logging client errors
			// This ensures graceful degradation
			logger.LogError(ex, "Error logging client error");
			return StatusCode(StatusCodes.Status500InternalServerError, "Error logging client error");
		}
	}

	/// <summary>
	/// Receives and stores multiple client-side error logs in a single batch.
	/// </summary>
	/// <param name="requests">Array of client log data.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>No content on success.</returns>
	/// <response code="204">Logs successfully recorded.</response>
	/// <response code="400">Invalid request data.</response>
	/// <response code="500">If an error occurs while logging the client errors.</response>
	[HttpPost("client/batch")]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<IActionResult> LogClientErrorBatchAsync(
		[FromBody] ClientLogRequest[] requests,
		CancellationToken cancellationToken = default)
	{
		try
		{
			await logService.CreateClientLogBatchAsync(requests, cancellationToken);

			// Invalidate logs cache after batch creating logs
			await outputCacheStore.EvictByTagAsync("logs", cancellationToken);

			return NoContent();
		}
		catch (Exception ex)
		{
			// Don't throw - we don't want to cause errors when logging client errors
			// This ensures graceful degradation
			logger.LogError(ex, "Error batch logging client errors");
			return StatusCode(StatusCodes.Status500InternalServerError, "Error batch logging client errors");
		}
	}
}