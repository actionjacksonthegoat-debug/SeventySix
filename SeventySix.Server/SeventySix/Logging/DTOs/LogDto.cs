// <copyright file="LogDto.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Logging;

/// <summary>Log entry data transfer object.</summary>
public record LogDto
{
	/// <summary>Gets the unique identifier.</summary>
	public int Id
	{
		get; init;
	}

	/// <summary>Gets the log level.</summary>
	public string LogLevel { get; init; } = string.Empty;

	/// <summary>Gets the log message.</summary>
	public string Message { get; init; } = string.Empty;

	/// <summary>Gets the exception message if applicable.</summary>
	public string? ExceptionMessage
	{
		get; init;
	}

	/// <summary>Gets the base exception message if different from exception.</summary>
	public string? BaseExceptionMessage
	{
		get; init;
	}

	/// <summary>Gets the call stack trace.</summary>
	public string? StackTrace
	{
		get; init;
	}

	/// <summary>Gets the source context (class name).</summary>
	public string? SourceContext
	{
		get; init;
	}

	/// <summary>Gets the HTTP request method.</summary>
	public string? RequestMethod
	{
		get; init;
	}

	/// <summary>Gets the HTTP request path.</summary>
	public string? RequestPath
	{
		get; init;
	}

	/// <summary>Gets the HTTP status code.</summary>
	public int? StatusCode
	{
		get; init;
	}

	/// <summary>Gets the request duration in milliseconds.</summary>
	public long? DurationMs
	{
		get; init;
	}

	/// <summary>Gets additional properties as JSON.</summary>
	public string? Properties
	{
		get; init;
	}

	/// <summary>Gets the timestamp when this log was created.</summary>
	public DateTime CreateDate
	{
		get; init;
	}

	/// <summary>Gets the machine/container name where the log originated.</summary>
	public string? MachineName
	{
		get; init;
	}

	/// <summary>Gets the environment (Development, Production, etc.).</summary>
	public string? Environment
	{
		get; init;
	}

	/// <summary>Gets the correlation ID (OpenTelemetry Trace ID) for distributed tracing.</summary>
	public string? CorrelationId
	{
		get; init;
	}

	/// <summary>Gets the span ID for this specific operation in the trace.</summary>
	public string? SpanId
	{
		get; init;
	}

	/// <summary>Gets the parent span ID if this is a child span.</summary>
	public string? ParentSpanId
	{
		get; init;
	}
}