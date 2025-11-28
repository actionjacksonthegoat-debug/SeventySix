// <copyright file="ClientLogRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.ComponentModel.DataAnnotations;

namespace SeventySix.Logging;

/// <summary>
/// Request DTO for client-side error logging.
/// </summary>
/// <remarks>
/// Represents error logs sent from the client (Angular app) to the server.
/// Contains all relevant error information including HTTP context, stack traces,
/// and additional metadata for debugging.
///
/// Design Patterns:
/// - DTO: Data Transfer Object for API request
///
/// SOLID Principles:
/// - SRP: Only responsible for client log data transfer
/// - OCP: Can be extended with additional properties without breaking clients
/// </remarks>
public class ClientLogRequest
{
	/// <summary>
	/// Gets or sets the log level (Error, Warning, Info, Debug, Critical).
	/// </summary>
	/// <example>Error</example>
	[Required(ErrorMessage = "LogLevel is required")]
	public required string LogLevel
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the log message.
	/// </summary>
	/// <example>HTTP 500: POST /api/users failed</example>
	[Required(ErrorMessage = "Message is required")]
	public required string Message
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the exception message if applicable.
	/// </summary>
	/// <example>Cannot read property 'id' of undefined</example>
	public string? ExceptionMessage
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the client-side stack trace.
	/// </summary>
	/// <example>at UserComponent.saveUser (user.component.ts:45:12)</example>
	public string? StackTrace
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the source context (Component/Service name).
	/// </summary>
	/// <example>UserComponent</example>
	public string? SourceContext
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the client-side route URL.
	/// </summary>
	/// <example>/admin/users/123</example>
	public string? RequestUrl
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the HTTP request method if applicable.
	/// </summary>
	/// <example>POST</example>
	public string? RequestMethod
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the HTTP status code if applicable.
	/// </summary>
	/// <example>500</example>
	public int? StatusCode
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the user agent string from the browser.
	/// </summary>
	/// <example>Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36</example>
	public string? UserAgent
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the client-side timestamp when the error occurred.
	/// </summary>
	/// <example>2025-11-12T14:30:00.000Z</example>
	public string? ClientTimestamp
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets additional context data as key-value pairs.
	/// </summary>
	/// <example>{ "userId": 123, "action": "save", "duration": 250 }</example>
	public Dictionary<string, object>? AdditionalContext
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the correlation ID (OpenTelemetry Trace ID) for distributed tracing.
	/// </summary>
	/// <example>4bf92f3577b34da6a3ce929d0e0e4736</example>
	public string? CorrelationId
	{
		get; set;
	}
}