// <copyright file="LogDto.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Logging;

/// <summary>
/// Log entry data transfer object.
/// Represents a read-only snapshot of log data for API responses.
/// </summary>
/// <remarks>
/// Not cached per Microsoft best practices: logs are write-heavy
/// and rarely re-read (low cache hit ratio).
/// </remarks>
/// <param name="Id">
/// The unique identifier.
/// </param>
/// <param name="LogLevel">
/// The log level.
/// </param>
/// <param name="Message">
/// The log message.
/// </param>
/// <param name="ExceptionMessage">
/// The exception message if applicable.
/// </param>
/// <param name="BaseExceptionMessage">
/// The base exception message if different from exception.
/// </param>
/// <param name="StackTrace">
/// The call stack trace.
/// </param>
/// <param name="SourceContext">
/// The source context (class name).
/// </param>
/// <param name="RequestMethod">
/// The HTTP request method.
/// </param>
/// <param name="RequestPath">
/// The HTTP request path.
/// </param>
/// <param name="StatusCode">
/// The HTTP status code.
/// </param>
/// <param name="DurationMs">
/// The request duration in milliseconds.
/// </param>
/// <param name="Properties">
/// Additional properties as JSON.
/// </param>
/// <param name="CreateDate">
/// The timestamp when this log was created.
/// </param>
/// <param name="MachineName">
/// The machine/container name where the log originated.
/// </param>
/// <param name="Environment">
/// The environment (Development, Production, etc.).
/// </param>
/// <param name="CorrelationId">
/// The correlation ID (OpenTelemetry Trace ID) for distributed tracing.
/// </param>
/// <param name="SpanId">
/// The span ID for this specific operation in the trace.
/// </param>
/// <param name="ParentSpanId">
/// The parent span ID if this is a child span.
/// </param>
public record LogDto(
	long Id,
	string LogLevel,
	string Message,
	string? ExceptionMessage,
	string? BaseExceptionMessage,
	string? StackTrace,
	string? SourceContext,
	string? RequestMethod,
	string? RequestPath,
	int? StatusCode,
	long? DurationMs,
	string? Properties,
	DateTime CreateDate,
	string? MachineName,
	string? Environment,
	string? CorrelationId,
	string? SpanId,
	string? ParentSpanId);