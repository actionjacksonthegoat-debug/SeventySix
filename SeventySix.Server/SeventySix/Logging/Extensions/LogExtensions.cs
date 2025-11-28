// <copyright file="LogExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Extensions;

namespace SeventySix.Logging;

/// <summary>Extension methods for Log entity mapping.</summary>
public static class LogExtensions
{
	/// <summary>Converts a Log domain entity to a DTO.</summary>
	/// <param name="entity">The domain entity to convert.</param>
	/// <returns>A LogDto containing the entity's data.</returns>
	public static LogDto ToDto(this Log entity)
	{
		ArgumentNullException.ThrowIfNull(entity);

		return new LogDto
		{
			Id = entity.Id,
			LogLevel = entity.LogLevel,
			Message = entity.Message,
			ExceptionMessage = entity.ExceptionMessage,
			BaseExceptionMessage = entity.BaseExceptionMessage,
			StackTrace = entity.StackTrace,
			SourceContext = entity.SourceContext,
			RequestMethod = entity.RequestMethod,
			RequestPath = entity.RequestPath,
			StatusCode = entity.StatusCode,
			DurationMs = entity.DurationMs,
			Properties = entity.Properties,
			CreateDate = entity.CreateDate,
			MachineName = entity.MachineName,
			Environment = entity.Environment,
			CorrelationId = entity.CorrelationId,
			SpanId = entity.SpanId,
			ParentSpanId = entity.ParentSpanId,
		};
	}

	/// <summary>Converts a collection of Log entities to a collection of DTOs.</summary>
	/// <param name="entities">The domain entities to convert.</param>
	/// <returns>A collection of LogDto DTOs.</returns>
	public static IEnumerable<LogDto> ToDto(this IEnumerable<Log> entities) =>
		entities.MapToDto(e => e.ToDto());
}