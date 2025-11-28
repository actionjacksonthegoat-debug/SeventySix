// <copyright file="CreateLogRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Logging;

/// <summary>Request DTO for creating a log entry from the client.</summary>
public record CreateLogRequest
{
	/// <summary>Gets the log level (Error, Warning, Info, Debug, Critical).</summary>
	public required string LogLevel
	{
		get; init;
	}

	/// <summary>Gets the log message.</summary>
	public required string Message
	{
		get; init;
	}

	/// <summary>Gets the exception message if applicable.</summary>
	public string? ExceptionMessage
	{
		get; init;
	}

	/// <summary>Gets the client-side stack trace.</summary>
	public string? StackTrace
	{
		get; init;
	}

	/// <summary>Gets the source context (Component/Service name).</summary>
	public string? SourceContext
	{
		get; init;
	}

	/// <summary>Gets the client-side route URL.</summary>
	public string? RequestUrl
	{
		get; init;
	}

	/// <summary>Gets the HTTP request method if applicable.</summary>
	public string? RequestMethod
	{
		get; init;
	}

	/// <summary>Gets the HTTP status code if applicable.</summary>
	public int? StatusCode
	{
		get; init;
	}

	/// <summary>Gets the user agent string from the browser.</summary>
	public string? UserAgent
	{
		get; init;
	}

	/// <summary>Gets the client-side timestamp when the error occurred.</summary>
	public string? ClientTimestamp
	{
		get; init;
	}

	/// <summary>Gets additional context data as key-value pairs.</summary>
	public Dictionary<string, object>? AdditionalContext
	{
		get; init;
	}

	/// <summary>Gets the correlation ID (OpenTelemetry Trace ID) for distributed tracing.</summary>
	public string? CorrelationId
	{
		get; init;
	}
}
