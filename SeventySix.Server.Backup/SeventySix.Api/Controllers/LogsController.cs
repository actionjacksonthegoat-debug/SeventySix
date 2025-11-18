// <copyright file="LogsController.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using SeventySix.Api.Attributes;
using SeventySix.Api.Configuration;
using SeventySix.Core.DTOs.LogCharts;
using SeventySix.Core.DTOs.Logs;
using SeventySix.Core.Entities;
using SeventySix.Core.Interfaces;

namespace SeventySix.Api.Controllers;

/// <summary>
/// API controller for managing and retrieving system logs.
/// </summary>
/// <remarks>
/// Provides endpoints for:
/// - Querying logs with filters and pagination
/// - Retrieving aggregated statistics
/// - Cleaning up old logs
///
/// Design Patterns:
/// - RESTful API with resource-based endpoints
/// - Repository pattern for data access
/// - DTO pattern for request/response models
///
/// SOLID Principles:
/// - SRP: Only responsible for HTTP API layer for logs
/// - DIP: Depends on ILogRepository abstraction
/// - OCP: Extensible for additional endpoints
/// </remarks>
/// <remarks>
/// Initializes a new instance of the <see cref="LogsController"/> class.
/// </remarks>
/// <param name="logRepository">The log repository.</param>
/// <param name="logChartService">The log chart service.</param>
/// <param name="logger">The logger.</param>
[ApiController]
[Route(ApiVersionConfig.VersionedRoutePrefix + "/logs")]
[RateLimit()] // 250 req/hour (default)
public class LogsController(
	ILogRepository logRepository,
	ILogChartService logChartService,
	ILogger<LogsController> logger,
	IOutputCacheStore outputCacheStore) : ControllerBase
{
	/// <summary>
	/// Gets logs with optional filtering and pagination.
	/// </summary>
	/// <param name="request">The filter and pagination parameters.</param>
	/// <returns>A paginated list of logs matching the filter criteria.</returns>
	/// <response code="200">Returns the filtered list of logs with pagination metadata.</response>
	/// <response code="400">If the request parameters are invalid.</response>
	/// <remarks>
	/// This endpoint uses output caching with tag-based invalidation.
	/// Cache is automatically cleared when logs are created or deleted.
	/// </remarks>
	[HttpGet]
	[OutputCache(PolicyName = "logs")]
	[ProducesResponseType(typeof(PagedLogResponse), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	public async Task<ActionResult<PagedLogResponse>> GetLogsAsync([FromQuery] LogFilterRequest request)
	{
		try
		{
			// Get total count for pagination
			int totalCount = await logRepository.GetLogsCountAsync(
				logLevel: request.LogLevel,
				startDate: request.StartDate,
				endDate: request.EndDate,
				sourceContext: request.SourceContext,
				requestPath: request.RequestPath);

			// Get paginated logs
			IEnumerable<Log> logs = await logRepository.GetLogsAsync(
				logLevel: request.LogLevel,
				startDate: request.StartDate,
				endDate: request.EndDate,
				sourceContext: request.SourceContext,
				requestPath: request.RequestPath,
				skip: request.GetSkip(),
				take: request.GetValidatedPageSize());

			List<LogResponse> logResponses = [.. logs.Select(log => new LogResponse
			{
				Id = log.Id,
				LogLevel = log.LogLevel,
				Message = log.Message,
				ExceptionMessage = log.ExceptionMessage,
				BaseExceptionMessage = log.BaseExceptionMessage,
				StackTrace = log.StackTrace,
				SourceContext = log.SourceContext,
				RequestMethod = log.RequestMethod,
				RequestPath = log.RequestPath,
				StatusCode = log.StatusCode,
				DurationMs = log.DurationMs,
				Properties = log.Properties,
				Timestamp = log.Timestamp,
				MachineName = log.MachineName,
				Environment = log.Environment,
				CorrelationId = log.CorrelationId,
				SpanId = log.SpanId,
				ParentSpanId = log.ParentSpanId,
			})];

			PagedLogResponse response = new()
			{
				Data = logResponses,
				TotalCount = totalCount,
				PageNumber = request.Page,
				PageSize = request.GetValidatedPageSize(),
			};

			return Ok(response);
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
	/// <returns>The total count of logs.</returns>
	/// <response code="200">Returns the total log count.</response>
	/// <response code="500">If an error occurs while retrieving the count.</response>
	[HttpGet("count")]
	[OutputCache(PolicyName = "logs")]
	[ProducesResponseType(typeof(LogCountResponse), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<ActionResult<LogCountResponse>> GetCountAsync([FromQuery] LogFilterRequest request)
	{
		try
		{
			int count = await logRepository.GetLogsCountAsync(
				logLevel: request.LogLevel,
				startDate: request.StartDate,
				endDate: request.EndDate,
				sourceContext: request.SourceContext,
				requestPath: request.RequestPath);

			return Ok(new LogCountResponse { Total = count });
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Error retrieving log count");
			return StatusCode(StatusCodes.Status500InternalServerError, "Error retrieving log count");
		}
	}

	/// <summary>
	/// Gets aggregated statistics for logs within an optional date range.
	/// </summary>
	/// <param name="startDate">The start date for the statistics period (optional).</param>
	/// <param name="endDate">The end date for the statistics period (optional).</param>
	/// <returns>Aggregated log statistics.</returns>
	/// <response code="200">Returns the log statistics.</response>
	/// <response code="500">If an error occurs while retrieving statistics.</response>
	[HttpGet("statistics")]
	[OutputCache(PolicyName = "logs")]
	[ProducesResponseType(typeof(LogStatisticsResponse), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<ActionResult<LogStatisticsResponse>> GetStatisticsAsync(
		[FromQuery] DateTime? startDate = null,
		[FromQuery] DateTime? endDate = null)
	{
		try
		{
			DateTime effectiveStartDate = startDate ?? DateTime.UtcNow.AddDays(-30);
			DateTime effectiveEndDate = endDate ?? DateTime.UtcNow;

			LogStatistics stats = await logRepository.GetStatisticsAsync(effectiveStartDate, effectiveEndDate);

			LogStatisticsResponse response = new()
			{
				TotalLogs = stats.TotalLogs,
				ErrorCount = stats.ErrorCount,
				WarningCount = stats.WarningCount,
				FatalCount = stats.FatalCount,
				AverageResponseTimeMs = stats.AverageResponseTimeMs,
				TotalRequests = stats.TotalRequests,
				FailedRequests = stats.FailedRequests,
				TopErrorSources = stats.TopErrorSources,
				RequestsByPath = stats.RequestsByPath,
				StartDate = effectiveStartDate,
				EndDate = effectiveEndDate,
			};

			return Ok(response);
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Error retrieving log statistics");
			return StatusCode(StatusCodes.Status500InternalServerError, "Error retrieving log statistics");
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
			bool deleted = await logRepository.DeleteByIdAsync(id, cancellationToken);

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
			int deletedCount = await logRepository.DeleteBatchAsync(ids, cancellationToken);

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
	public async Task<ActionResult<int>> CleanupLogsAsync([FromQuery] DateTime? cutoffDate)
	{
		if (!cutoffDate.HasValue)
		{
			return BadRequest("Cutoff date is required");
		}

		try
		{
			int deletedCount = await logRepository.DeleteOlderThanAsync(cutoffDate.Value);

			// Invalidate logs cache after cleanup
			await outputCacheStore.EvictByTagAsync("logs", CancellationToken.None);

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
			// Get trace context from current HTTP request
			string? traceId = System.Diagnostics.Activity.Current?.TraceId.ToString();
			string? spanId = System.Diagnostics.Activity.Current?.SpanId.ToString();
			string? parentSpanId = System.Diagnostics.Activity.Current?.ParentSpanId.ToString();

			// Map ClientLogRequest to Log entity
			Log log = new()
			{
				LogLevel = request.LogLevel,
				Message = request.Message,
				ExceptionMessage = request.ExceptionMessage,
				StackTrace = request.StackTrace,
				SourceContext = request.SourceContext,
				RequestPath = request.RequestUrl,
				RequestMethod = request.RequestMethod,
				StatusCode = request.StatusCode,
				CorrelationId = request.CorrelationId ?? traceId,
				SpanId = spanId,
				ParentSpanId = parentSpanId,
				Properties = JsonSerializer.Serialize(new
				{
					request.UserAgent,
					request.ClientTimestamp,
					request.AdditionalContext,
				}),
				Timestamp = DateTime.UtcNow,
				MachineName = "Browser",
				Environment = "Client",
			};

			await logRepository.CreateAsync(log, cancellationToken);

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
			// Handle empty batch gracefully
			if (requests == null || requests.Length == 0)
			{
				return NoContent();
			}

			// Get trace context from current HTTP request
			string? traceId = System.Diagnostics.Activity.Current?.TraceId.ToString();
			string? spanId = System.Diagnostics.Activity.Current?.SpanId.ToString();
			string? parentSpanId = System.Diagnostics.Activity.Current?.ParentSpanId.ToString();

			// Map all requests to Log entities
			List<Log> logs = [.. requests.Select(request => new Log
			{
				LogLevel = request.LogLevel,
				Message = request.Message,
				ExceptionMessage = request.ExceptionMessage,
				StackTrace = request.StackTrace,
				SourceContext = request.SourceContext,
				RequestPath = request.RequestUrl,
				RequestMethod = request.RequestMethod,
				StatusCode = request.StatusCode,
				CorrelationId = request.CorrelationId ?? traceId,
				SpanId = spanId,
				ParentSpanId = parentSpanId,
				Properties = JsonSerializer.Serialize(new
				{ request.UserAgent,
					 request.ClientTimestamp,
					 request.AdditionalContext,
				}),
				Timestamp = DateTime.UtcNow,
				MachineName = "Browser",
				Environment = "Client",
			})];

			// Create all logs
			foreach (Log? log in logs)
			{
				await logRepository.CreateAsync(log, cancellationToken);
			}

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

	/// <summary>
	/// Retrieves log counts grouped by severity level.
	/// </summary>
	/// <param name="startDate">Optional start date for filtering.</param>
	/// <param name="endDate">Optional end date for filtering.</param>
	/// <param name="cancellationToken">Cancellation token for the async operation.</param>
	/// <returns>Log counts by level.</returns>
	/// <response code="200">Returns the log counts by level.</response>
	[HttpGet("charts/bylevel")]
	[OutputCache(PolicyName = "logcharts")]
	[ProducesResponseType(typeof(LogsByLevelResponse), StatusCodes.Status200OK)]
	public async Task<ActionResult<LogsByLevelResponse>> GetLogsByLevelAsync(
		[FromQuery] DateTime? startDate,
		[FromQuery] DateTime? endDate,
		CancellationToken cancellationToken)
	{
		LogsByLevelResponse data = await logChartService.GetLogsByLevelAsync(startDate, endDate, cancellationToken);
		return Ok(data);
	}

	/// <summary>
	/// Retrieves log counts grouped by hour.
	/// </summary>
	/// <param name="hoursBack">Number of hours to look back from current time (default: 24).</param>
	/// <param name="cancellationToken">Cancellation token for the async operation.</param>
	/// <returns>Hourly log counts.</returns>
	/// <response code="200">Returns the hourly log counts.</response>
	[HttpGet("charts/byhour")]
	[OutputCache(PolicyName = "logcharts")]
	[ProducesResponseType(typeof(LogsByHourResponse), StatusCodes.Status200OK)]
	public async Task<ActionResult<LogsByHourResponse>> GetLogsByHourAsync(
		[FromQuery] int? hoursBack,
		CancellationToken cancellationToken)
	{
		LogsByHourResponse data = await logChartService.GetLogsByHourAsync(hoursBack ?? 24, cancellationToken);
		return Ok(data);
	}

	/// <summary>
	/// Retrieves log counts grouped by source component.
	/// </summary>
	/// <param name="topN">Number of top sources to return (default: 10).</param>
	/// <param name="cancellationToken">Cancellation token for the async operation.</param>
	/// <returns>Log counts by source.</returns>
	/// <response code="200">Returns the log counts by source.</response>
	[HttpGet("charts/bysource")]
	[OutputCache(PolicyName = "logcharts")]
	[ProducesResponseType(typeof(LogsBySourceResponse), StatusCodes.Status200OK)]
	public async Task<ActionResult<LogsBySourceResponse>> GetLogsBySourceAsync(
		[FromQuery] int? topN,
		CancellationToken cancellationToken)
	{
		LogsBySourceResponse data = await logChartService.GetLogsBySourceAsync(topN ?? 10, cancellationToken);
		return Ok(data);
	}

	/// <summary>
	/// Retrieves recent error and warning log entries.
	/// </summary>
	/// <param name="count">Number of recent errors to return (default: 50).</param>
	/// <param name="cancellationToken">Cancellation token for the async operation.</param>
	/// <returns>Recent error log summaries.</returns>
	/// <response code="200">Returns the recent errors.</response>
	[HttpGet("charts/recenterrors")]
	[OutputCache(PolicyName = "logcharts")]
	[ProducesResponseType(typeof(RecentErrorsResponse), StatusCodes.Status200OK)]
	public async Task<ActionResult<RecentErrorsResponse>> GetRecentErrorsAsync(
		[FromQuery] int? count,
		CancellationToken cancellationToken)
	{
		RecentErrorsResponse data = await logChartService.GetRecentErrorsAsync(count ?? 50, cancellationToken);
		return Ok(data);
	}

	/// <summary>
	/// Retrieves time-series log data for charting.
	/// </summary>
	/// <param name="period">Time period for the chart (24h, 7d, 30d). Default: 24h.</param>
	/// <param name="cancellationToken">Cancellation token for the async operation.</param>
	/// <returns>Chart data with time-series log counts.</returns>
	/// <response code="200">Returns the chart data.</response>
	/// <response code="400">If the period parameter is invalid.</response>
	[HttpGet("chartdata")]
	[OutputCache(PolicyName = "logcharts")]
	[ProducesResponseType(typeof(LogChartDataResponse), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	public async Task<ActionResult<LogChartDataResponse>> GetChartDataAsync(
	[FromQuery] string? period,
	CancellationToken cancellationToken)
	{
		try
		{
			string validPeriod = period ?? "24h";
			LogChartDataResponse data = await logChartService.GetChartDataAsync(validPeriod, cancellationToken);
			return Ok(data);
		}
		catch (ArgumentException ex)
		{
			return BadRequest(new { error = ex.Message });
		}
	}
}