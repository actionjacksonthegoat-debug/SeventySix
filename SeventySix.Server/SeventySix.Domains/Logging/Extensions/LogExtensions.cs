// <copyright file="LogExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

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
}