// <copyright file="LogBuilder.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Logging;

namespace SeventySix.TestUtilities.Builders;

/// <summary>
/// Fluent builder for creating Log entities in tests.
/// </summary>
/// <remarks>
/// Provides a convenient way to create Log entities with default test values.
/// Reduces boilerplate code in test setup.
///
/// Usage:
/// <code>
/// Log log = new LogBuilder()
///     .WithLogLevel(LogLevelConstants.Error)
///     .WithMessage("Test error")
///     .Build();
/// </code>
///
/// Design Patterns:
/// - Builder Pattern: Fluent API for constructing complex objects
/// - Test Data Builder: Specialized builder for test data
/// </remarks>
public class LogBuilder
{
	private readonly TimeProvider TimeProvider;
	private string LogLevel =
		LogLevelConstants.Information;
	private string Message = "Test log message";
	private string? ExceptionMessage = null;
	private string? BaseExceptionMessage = null;
	private string? StackTrace = null;
	private string? SourceContext = "SeventySix.Tests";
	private string? RequestMethod = null;
	private string? RequestPath = null;
	private int? StatusCode = null;
	private long? DurationMs = null;
	private string? Properties = null;
	private DateTimeOffset CreateDate;
	private string? MachineName = "test-machine";
	private string? Environment = "Test";
	private string? CorrelationId = null;
	private string? SpanId = null;
	private string? ParentSpanId = null;

	/// <summary>
	/// Initializes a new instance of the <see cref="LogBuilder"/> class.
	/// </summary>
	/// <param name="timeProvider">
	/// The time provider for default timestamps.
	/// </param>
	public LogBuilder(TimeProvider timeProvider)
	{
		TimeProvider = timeProvider;
		CreateDate =
			timeProvider.GetUtcNow();
	}

	/// <summary>
	/// Sets the log level.
	/// </summary>
	/// <param name="logLevel">
	/// The log level (Warning, Error, Fatal, etc.).
	/// </param>
	/// <returns>
	/// The builder instance for method chaining.
	/// </returns>
	public LogBuilder WithLogLevel(string logLevel)
	{
		LogLevel = logLevel;
		return this;
	}

	/// <summary>
	/// Sets the log message.
	/// </summary>
	/// <param name="message">
	/// The log message.
	/// </param>
	/// <returns>
	/// The builder instance for method chaining.
	/// </returns>
	public LogBuilder WithMessage(string message)
	{
		Message = message;
		return this;
	}

	/// <summary>
	/// Sets the exception message.
	/// </summary>
	/// <param name="exceptionMessage">
	/// The exception message.
	/// </param>
	/// <returns>
	/// The builder instance for method chaining.
	/// </returns>
	public LogBuilder WithExceptionMessage(string? exceptionMessage)
	{
		ExceptionMessage = exceptionMessage;
		return this;
	}

	/// <summary>
	/// Sets the base exception message.
	/// </summary>
	/// <param name="baseExceptionMessage">
	/// The base exception message.
	/// </param>
	/// <returns>
	/// The builder instance for method chaining.
	/// </returns>
	public LogBuilder WithBaseExceptionMessage(string? baseExceptionMessage)
	{
		BaseExceptionMessage =
			baseExceptionMessage;
		return this;
	}

	/// <summary>
	/// Sets the stack trace.
	/// </summary>
	/// <param name="stackTrace">
	/// The stack trace.
	/// </param>
	/// <returns>
	/// The builder instance for method chaining.
	/// </returns>
	public LogBuilder WithStackTrace(string? stackTrace)
	{
		StackTrace = stackTrace;
		return this;
	}

	/// <summary>
	/// Sets the source context.
	/// </summary>
	/// <param name="sourceContext">
	/// The source context (class name).
	/// </param>
	/// <returns>
	/// The builder instance for method chaining.
	/// </returns>
	public LogBuilder WithSourceContext(string? sourceContext)
	{
		SourceContext = sourceContext;
		return this;
	}

	/// <summary>
	/// Sets the HTTP request details.
	/// </summary>
	/// <param name="method">
	/// The HTTP method.
	/// </param>
	/// <param name="path">
	/// The request path.
	/// </param>
	/// <param name="statusCode">
	/// The HTTP status code.
	/// </param>
	/// <param name="durationMs">
	/// The request duration in milliseconds.
	/// </param>
	/// <returns>
	/// The builder instance for method chaining.
	/// </returns>
	public LogBuilder WithHttpRequest(
		string? method,
		string? path,
		int? statusCode = null,
		long? durationMs = null)
	{
		RequestMethod = method;
		RequestPath = path;
		StatusCode = statusCode;
		DurationMs = durationMs;
		return this;
	}

	/// <summary>
	/// Sets the CreateDate.
	/// </summary>
	/// <param name="timestamp">
	/// The log CreateDate.
	/// </param>
	/// <returns>
	/// The builder instance for method chaining.
	/// </returns>
	public LogBuilder WithTimestamp(DateTimeOffset createDate)
	{
		CreateDate = createDate;
		return this;
	}

	/// <summary>
	/// Sets the machine name.
	/// </summary>
	/// <param name="machineName">
	/// The machine name.
	/// </param>
	/// <returns>
	/// The builder instance for method chaining.
	/// </returns>
	public LogBuilder WithMachineName(string? machineName)
	{
		MachineName = machineName;
		return this;
	}

	/// <summary>
	/// Sets the environment.
	/// </summary>
	/// <param name="environment">
	/// The environment (Development, Production, etc.).
	/// </param>
	/// <returns>
	/// The builder instance for method chaining.
	/// </returns>
	public LogBuilder WithEnvironment(string? environment)
	{
		Environment = environment;
		return this;
	}

	/// <summary>
	/// Sets the correlation ID.
	/// </summary>
	/// <param name="correlationId">
	/// The correlation ID.
	/// </param>
	/// <returns>
	/// The builder instance for method chaining.
	/// </returns>
	public LogBuilder WithCorrelationId(string? correlationId)
	{
		CorrelationId = correlationId;
		return this;
	}

	/// <summary>
	/// Sets the distributed tracing span IDs.
	/// </summary>
	/// <param name="spanId">
	/// The span ID.
	/// </param>
	/// <param name="parentSpanId">
	/// The parent span ID.
	/// </param>
	/// <returns>
	/// The builder instance for method chaining.
	/// </returns>
	public LogBuilder WithSpanIds(string? spanId, string? parentSpanId = null)
	{
		SpanId = spanId;
		ParentSpanId = parentSpanId;
		return this;
	}

	/// <summary>
	/// Sets the additional properties as JSON.
	/// </summary>
	/// <param name="properties">
	/// The additional properties.
	/// </param>
	/// <returns>
	/// The builder instance for method chaining.
	/// </returns>
	public LogBuilder WithProperties(string? properties)
	{
		Properties = properties;
		return this;
	}

	/// <summary>
	/// Builds the Log entity with the configured values.
	/// </summary>
	/// <returns>
	/// A new Log instance.
	/// </returns>
	public Log Build()
	{
		return new Log
		{
			LogLevel = LogLevel,
			Message = Message,
			ExceptionMessage = ExceptionMessage,
			BaseExceptionMessage =
				BaseExceptionMessage,
			StackTrace = StackTrace,
			SourceContext = SourceContext,
			RequestMethod = RequestMethod,
			RequestPath = RequestPath,
			StatusCode = StatusCode,
			DurationMs = DurationMs,
			Properties = Properties,
			CreateDate = CreateDate,
			MachineName = MachineName,
			Environment = Environment,
			CorrelationId = CorrelationId,
			SpanId = SpanId,
			ParentSpanId = ParentSpanId,
		};
	}

	/// <summary>
	/// Creates a default Warning level log.
	/// </summary>
	/// <param name="timeProvider">
	/// The time provider for generating timestamps.
	/// </param>
	/// <returns>
	/// A new LogBuilder configured for a Warning log.
	/// </returns>
	public static LogBuilder CreateWarning(TimeProvider timeProvider)
	{
		return new LogBuilder(timeProvider).WithLogLevel(
			LogLevelConstants.Warning);
	}

	/// <summary>
	/// Creates a default Error level log.
	/// </summary>
	/// <param name="timeProvider">
	/// The time provider for generating timestamps.
	/// </param>
	/// <returns>
	/// A new LogBuilder configured for an Error log.
	/// </returns>
	public static LogBuilder CreateError(TimeProvider timeProvider)
	{
		return new LogBuilder(timeProvider)
			.WithLogLevel(LogLevelConstants.Error)
			.WithExceptionMessage("Test exception");
	}

	/// <summary>
	/// Creates a default Fatal level log.
	/// </summary>
	/// <param name="timeProvider">
	/// The time provider for generating timestamps.
	/// </param>
	/// <returns>
	/// A new LogBuilder configured for a Fatal log.
	/// </returns>
	public static LogBuilder CreateFatal(TimeProvider timeProvider)
	{
		return new LogBuilder(timeProvider)
			.WithLogLevel(LogLevelConstants.Fatal)
			.WithExceptionMessage("Fatal exception")
			.WithStackTrace("at SeventySix.Test.Method()");
	}
}