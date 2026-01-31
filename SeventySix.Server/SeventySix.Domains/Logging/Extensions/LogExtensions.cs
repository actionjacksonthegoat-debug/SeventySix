// <copyright file="LogExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Text.Json;
using SeventySix.Shared.Extensions;

namespace SeventySix.Logging;

/// <summary>
/// Extension methods for Log entity mapping.
/// </summary>
public static class LogExtensions
{
	/// <summary>
	/// Converts a Log domain entity to a DTO.
	/// </summary>
	/// <param name="entity">
	/// The domain entity to convert.
	/// </param>
	/// <returns>
	/// A LogDto containing the entity's data.
	/// </returns>
	public static LogDto ToDto(this Log entity)
	{
		ArgumentNullException.ThrowIfNull(entity);

		return new LogDto(
			entity.Id,
			entity.LogLevel,
			entity.Message,
			entity.ExceptionMessage,
			entity.BaseExceptionMessage,
			entity.StackTrace,
			entity.SourceContext,
			entity.RequestMethod,
			entity.RequestPath,
			entity.StatusCode,
			entity.DurationMs,
			entity.Properties,
			entity.CreateDate,
			entity.MachineName,
			entity.Environment,
			entity.CorrelationId,
			entity.SpanId,
			entity.ParentSpanId);
	}

	/// <summary>
	/// Converts a collection of Log entities to a collection of DTOs.
	/// </summary>
	/// <param name="entities">
	/// The domain entities to convert.
	/// </param>
	/// <returns>
	/// A collection of LogDto DTOs.
	/// </returns>
	public static IEnumerable<LogDto> ToDto(this IEnumerable<Log> entities) =>
		entities.MapToDto(logEntry => logEntry.ToDto());

	/// <summary>
	/// Converts a client log request to a Log entity.
	/// </summary>
	/// <param name="request">
	/// The create log request.
	/// </param>
	/// <param name="traceId">
	/// The trace identifier from the current activity.
	/// </param>
	/// <param name="spanId">
	/// The span identifier from the current activity.
	/// </param>
	/// <param name="parentSpanId">
	/// The parent span identifier from the current activity.
	/// </param>
	/// <returns>
	/// A new Log entity populated from the request.
	/// </returns>
	/// <remarks>
	/// DRY: Consolidates client log creation logic used in
	/// CreateClientLogCommandHandler and CreateClientLogBatchCommandHandler.
	/// </remarks>
	public static Log ToClientLogEntity(
		this CreateLogRequest request,
		string? traceId,
		string? spanId,
		string? parentSpanId)
	{
		ArgumentNullException.ThrowIfNull(request);

		return new Log
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
				JsonSerializer.Serialize(
					new
					{
						request.UserAgent,
						request.ClientTimestamp,
						request.AdditionalContext,
					}),
			MachineName = "Browser",
			Environment = "Client",
		};
	}
}