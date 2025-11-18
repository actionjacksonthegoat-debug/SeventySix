// <copyright file="LogResponse.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.BusinessLogic.DTOs.Logs;

/// <summary>
/// Response DTO for log entry.
/// </summary>
/// <remarks>
/// Represents a single log entry returned from the API.
/// Contains all relevant log information including exception details and HTTP context.
///
/// Design Patterns:
/// - DTO: Data Transfer Object for API response
///
/// SOLID Principles:
/// - SRP: Only responsible for log data transfer
/// </remarks>
public class LogResponse
{
	/// <summary>
	/// Gets or sets the unique identifier.
	/// </summary>
	public int Id
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the log level.
	/// </summary>
	public string LogLevel { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the log message.
	/// </summary>
	public string Message { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the exception message if applicable.
	/// </summary>
	public string? ExceptionMessage
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the base exception message if different from exception.
	/// </summary>
	public string? BaseExceptionMessage
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the call stack trace.
	/// </summary>
	public string? StackTrace
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the source context (class name).
	/// </summary>
	public string? SourceContext
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the HTTP request method.
	/// </summary>
	public string? RequestMethod
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the HTTP request path.
	/// </summary>
	public string? RequestPath
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the HTTP status code.
	/// </summary>
	public int? StatusCode
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the request duration in milliseconds.
	/// </summary>
	public long? DurationMs
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets additional properties as JSON.
	/// </summary>
	public string? Properties
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the timestamp when this log was created.
	/// </summary>
	public DateTime Timestamp
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the machine/container name where the log originated.
	/// </summary>
	public string? MachineName
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the environment (Development, Production, etc.).
	/// </summary>
	public string? Environment
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the correlation ID (OpenTelemetry Trace ID) for distributed tracing.
	/// </summary>
	public string? CorrelationId
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the span ID for this specific operation in the trace.
	/// </summary>
	public string? SpanId
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the parent span ID if this is a child span.
	/// </summary>
	public string? ParentSpanId
	{
		get; set;
	}
}