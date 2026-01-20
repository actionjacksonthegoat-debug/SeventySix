// <copyright file="LogsController.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using SeventySix.Api.Configuration;
using SeventySix.Identity.Constants;
using SeventySix.Logging;
using SeventySix.Shared.POCOs;
using Wolverine;

namespace SeventySix.Api.Controllers;

/// <summary>API controller for managing and retrieving system logs.</summary>
/// <param name="messageBus">
/// The Wolverine message bus for CQRS operations.
/// </param>
/// <param name="outputCacheStore">
/// The output cache store.
/// </param>
[ApiController]
[Authorize(Policy = PolicyConstants.AdminOnly)]
[Route(ApiVersionConfig.VersionedRoutePrefix + "/logs")]
public class LogsController(
	IMessageBus messageBus,
	IOutputCacheStore outputCacheStore) : ControllerBase
{
	/// <summary>Gets logs with filtering, searching, sorting, and pagination.</summary>
	/// <param name="request">
	/// The filter, search, sort, and pagination parameters.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// A paginated list of logs matching the filter criteria.
	/// </returns>
	/// <response code="200">Returns the filtered list of logs with pagination metadata.</response>
	/// <response code="400">If the request parameters are invalid.</response>
	[HttpGet]
	[OutputCache(PolicyName = CachePolicyConstants.Logs)]
	[ProducesResponseType(typeof(PagedResult<LogDto>), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	public async Task<ActionResult<PagedResult<LogDto>>> GetPagedAsync(
		[FromQuery] LogQueryRequest request,
		CancellationToken cancellationToken = default)
	{
		PagedResult<LogDto> result =
			await messageBus.InvokeAsync<
				PagedResult<LogDto>>(
					new GetLogsPagedQuery(request),
					cancellationToken);

		return Ok(result);
	}

	/// <summary>Deletes a single log entry by ID.</summary>
	/// <param name="id">
	/// The ID of the log to delete.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// No content if successful; not found if log doesn't exist.
	/// </returns>
	/// <response code="204">Log successfully deleted.</response>
	/// <response code="404">Log with specified ID not found.</response>
	[HttpDelete("{id}")]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	public async Task<IActionResult> DeleteLogAsync(
		long id,
		CancellationToken cancellationToken = default)
	{
		Result deleted =
			await messageBus.InvokeAsync<Result>(
				new DeleteLogCommand(id),
				cancellationToken);

		if (!deleted.IsSuccess)
		{
			return NotFound();
		}

		await outputCacheStore.EvictByTagAsync("logs", cancellationToken);

		return NoContent();
	}

	/// <summary>Deletes multiple log entries in a single batch operation.</summary>
	/// <param name="ids">
	/// Array of log IDs to delete.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// The number of logs successfully deleted.
	/// </returns>
	/// <response code="200">Returns the count of deleted logs.</response>
	/// <response code="400">If no log IDs are provided.</response>
	[HttpDelete("batch")]
	[ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	public async Task<ActionResult<int>> DeleteLogBatchAsync(
		[FromBody] long[] ids,
		CancellationToken cancellationToken = default)
	{
		if (ids == null || ids.Length == 0)
		{
			return BadRequest(
				new ProblemDetails
				{
					Title = "Invalid Request",
					Detail = "No log IDs provided",
					Status = StatusCodes.Status400BadRequest,
				});
		}

		int deletedCount =
			await messageBus.InvokeAsync<int>(
				new DeleteLogsBatchCommand(ids),
				cancellationToken);

		await outputCacheStore.EvictByTagAsync("logs", cancellationToken);

		return Ok(deletedCount);
	}

	/// <summary>Deletes logs older than the specified cutoff date.</summary>
	/// <param name="cutoffDate">
	/// The cutoff date. Logs older than this date will be deleted.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// The number of deleted logs.
	/// </returns>
	/// <response code="200">Returns the number of deleted logs.</response>
	/// <response code="400">If the cutoff date is not provided or invalid.</response>
	[HttpDelete("cleanup")]
	[ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	public async Task<ActionResult<int>> CleanupLogsAsync(
		[FromQuery] DateTime? cutoffDate,
		CancellationToken cancellationToken = default)
	{
		if (!cutoffDate.HasValue)
		{
			return BadRequest(
				new ProblemDetails
				{
					Title = "Invalid Request",
					Detail = "Cutoff date is required",
					Status = StatusCodes.Status400BadRequest,
				});
		}

		int deletedCount =
			await messageBus.InvokeAsync<int>(
				new DeleteLogsOlderThanCommand(cutoffDate.Value),
				cancellationToken);

		await outputCacheStore.EvictByTagAsync("logs", cancellationToken);

		return Ok(deletedCount);
	}

	/// <summary>Receives and stores client-side error logs.</summary>
	/// <param name="request">
	/// The client log data.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// No content on success.
	/// </returns>
	/// <response code="204">Log successfully recorded.</response>
	/// <response code="400">Invalid request data.</response>
	[HttpPost("client")]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	public async Task<IActionResult> LogClientErrorAsync(
		[FromBody] CreateLogRequest request,
		CancellationToken cancellationToken = default)
	{
		await messageBus.InvokeAsync(request, cancellationToken);

		await outputCacheStore.EvictByTagAsync("logs", cancellationToken);

		return NoContent();
	}

	/// <summary>Receives and stores multiple client-side error logs in a single batch.</summary>
	/// <param name="requests">
	/// Array of client log data.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// No content on success.
	/// </returns>
	/// <response code="204">Logs successfully recorded.</response>
	/// <response code="400">Invalid request data.</response>
	[HttpPost("client/batch")]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	public async Task<IActionResult> LogClientErrorBatchAsync(
		[FromBody] CreateLogRequest[] requests,
		CancellationToken cancellationToken = default)
	{
		await messageBus.InvokeAsync(requests, cancellationToken);

		await outputCacheStore.EvictByTagAsync("logs", cancellationToken);

		return NoContent();
	}
}