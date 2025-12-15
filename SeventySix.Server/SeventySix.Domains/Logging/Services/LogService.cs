// <copyright file="LogService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using SeventySix.Shared.DTOs;

namespace SeventySix.Logging;

/// <summary>Log service implementation.</summary>
/// <param name="repository">The repository for data access operations.</param>
/// <param name="queryValidator">The validator for query requests.</param>
public class LogService(
	ILogRepository repository,
	IValidator<LogQueryRequest> queryValidator) : ILogService
{
	/// <inheritdoc/>
	public string ContextName => "Logging";

	/// <inheritdoc/>
	public async Task<PagedResult<LogDto>> GetPagedLogsAsync(
		LogQueryRequest request,
		CancellationToken cancellationToken = default)
	{
		await queryValidator.ValidateAndThrowAsync(request, cancellationToken);

		(IEnumerable<Log> logs, int totalCount) =
			await repository.GetPagedAsync(request, cancellationToken);

		return new PagedResult<LogDto>
		{
			Items = logs.ToDto().ToList(),
			Page = request.Page,
			PageSize = request.PageSize,
			TotalCount = totalCount,
		};
	}

	/// <inheritdoc/>
	public async Task<bool> DeleteLogByIdAsync(
		int id,
		CancellationToken cancellationToken = default)
	{
		return await repository.DeleteByIdAsync(id, cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<int> DeleteLogsBatchAsync(
		int[] ids,
		CancellationToken cancellationToken = default)
	{
		return await repository.DeleteBatchAsync(ids, cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<int> DeleteLogsOlderThanAsync(
		DateTime cutoffDate,
		CancellationToken cancellationToken = default)
	{
		return await repository.DeleteOlderThanAsync(
			cutoffDate,
			cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<bool> CheckHealthAsync(
		CancellationToken cancellationToken = default)
	{
		try
		{
			LogQueryRequest healthCheckRequest =
				new()
			{
				Page = 1,
				PageSize = 1,
			};
			_ =
				await repository.GetPagedAsync(
					healthCheckRequest,
					cancellationToken);
			return true;
		}
		catch
		{
			return false;
		}
	}

	/// <inheritdoc/>
	public async Task CreateClientLogAsync(
		CreateLogRequest request,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(request);

		string? traceId =
			System.Diagnostics.Activity.Current?.TraceId.ToString();
		string? spanId =
			System.Diagnostics.Activity.Current?.SpanId.ToString();
		string? parentSpanId =
			System.Diagnostics.Activity.Current?.ParentSpanId.ToString();

		Log log =
			new()
		{
			LogLevel = request.LogLevel,
			Message = request.Message,
			ExceptionMessage = request.ExceptionMessage,
			StackTrace = request.StackTrace,
			SourceContext = request.SourceContext,
			RequestPath = request.RequestUrl,
			RequestMethod = request.RequestMethod,
			StatusCode = request.StatusCode,
			CorrelationId =
			request.CorrelationId ?? traceId,
			SpanId = spanId,
			ParentSpanId = parentSpanId,
			Properties =
			System.Text.Json.JsonSerializer.Serialize(
				new
				{
					request.UserAgent,
					request.ClientTimestamp,
					request.AdditionalContext,
				}),
			MachineName = "Browser",
			Environment = "Client",
		};

		await repository.CreateAsync(log, cancellationToken);
	}

	/// <inheritdoc/>
	public async Task CreateClientLogBatchAsync(
		CreateLogRequest[] requests,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(requests);

		if (requests.Length == 0)
		{
			return;
		}

		string? traceId =
			System.Diagnostics.Activity.Current?.TraceId.ToString();
		string? spanId =
			System.Diagnostics.Activity.Current?.SpanId.ToString();
		string? parentSpanId =
			System.Diagnostics.Activity.Current?.ParentSpanId.ToString();

		foreach (CreateLogRequest request in requests)
		{
			Log log =
				new()
			{
				LogLevel = request.LogLevel,
				Message = request.Message,
				ExceptionMessage = request.ExceptionMessage,
				StackTrace = request.StackTrace,
				SourceContext = request.SourceContext,
				RequestPath = request.RequestUrl,
				RequestMethod = request.RequestMethod,
				StatusCode = request.StatusCode,
				CorrelationId =
				request.CorrelationId ?? traceId,
				SpanId = spanId,
				ParentSpanId = parentSpanId,
				Properties =
				System.Text.Json.JsonSerializer.Serialize(
					new
					{
						request.UserAgent,
						request.ClientTimestamp,
						request.AdditionalContext,
					}),
				MachineName = "Browser",
				Environment = "Client",
			};

			await repository.CreateAsync(log, cancellationToken);
		}
	}
}
