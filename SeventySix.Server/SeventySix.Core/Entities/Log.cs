// <copyright file="Log.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Core.Entities;

/// <summary>
/// Domain entity representing a system log entry.
/// </summary>
/// <remarks>
/// Stores application logs for error tracking, diagnostics, and auditing.
/// Supports Warning level and above for database persistence.
///
/// Design Patterns:
/// - Domain Model: Rich entity with structured log data
///
/// SOLID Principles:
/// - SRP: Only responsible for log entry state
/// - No framework dependencies (pure POCO)
/// </remarks>
public class Log
{
	/// <summary>
	/// Gets or sets the unique identifier.
	/// </summary>
	public int Id
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the log level (Warning, Error, Fatal).
	/// </summary>
	/// <example>Error</example>
	public required string LogLevel
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the log message.
	/// </summary>
	public required string Message
	{
		get; set;
	}

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
}