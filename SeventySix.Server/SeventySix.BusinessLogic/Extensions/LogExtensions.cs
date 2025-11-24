// <copyright file="LogExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.BusinessLogic.DTOs.Logs;
using SeventySix.BusinessLogic.Entities;

namespace SeventySix.BusinessLogic.Extensions;

/// <summary>
/// Extension methods for Log entity mapping.
/// Provides clean, reusable mapping between domain entities and DTOs.
/// </summary>
/// <remarks>
/// This class implements the Adapter pattern, translating between different
/// object representations (Domain Entities ↔ DTOs).
///
/// Design Benefits:
/// - Separation of Concerns: Domain models remain independent of API contracts
/// - Reusability: Mapping logic is centralized and reusable
/// - Testability: Extension methods are easy to unit test
/// - Fluent API: Enables readable method chaining
///
/// Mapping Strategy:
/// - Entity → DTO: For read operations (GET requests)
/// </remarks>
public static class LogExtensions
{
	/// <summary>
	/// Converts a Log domain entity to a data transfer object (DTO).
	/// </summary>
	/// <param name="entity">The domain entity to convert.</param>
	/// <returns>A LogResponse containing the entity's data.</returns>
	/// <exception cref="ArgumentNullException">Thrown when entity is null.</exception>
	/// <remarks>
	/// This method maps all properties from the domain entity to the DTO.
	/// </remarks>
	public static LogResponse ToDto(this Log entity)
	{
		ArgumentNullException.ThrowIfNull(entity);

		return new LogResponse
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
			Timestamp = entity.Timestamp,
			MachineName = entity.MachineName,
			Environment = entity.Environment,
			CorrelationId = entity.CorrelationId,
			SpanId = entity.SpanId,
			ParentSpanId = entity.ParentSpanId,
		};
	}

	/// <summary>
	/// Converts a collection of Log entities to a collection of DTOs.
	/// </summary>
	/// <param name="entities">The domain entities to convert.</param>
	/// <returns>A collection of LogResponse DTOs.</returns>
	/// <exception cref="ArgumentNullException">Thrown when entities is null.</exception>
	/// <remarks>
	/// Uses Select to efficiently map each entity to a DTO.
	/// Maintains original collection order.
	/// </remarks>
	public static IEnumerable<LogResponse> ToDto(this IEnumerable<Log> entities)
	{
		ArgumentNullException.ThrowIfNull(entities);

		return entities.Select(e => e.ToDto());
	}
}
