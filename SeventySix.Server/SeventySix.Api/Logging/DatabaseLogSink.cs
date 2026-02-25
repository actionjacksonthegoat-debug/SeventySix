// <copyright file="DatabaseLogSink.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Concurrent;
using System.Text;
using Serilog.Core;
using Serilog.Events;
using SeventySix.Logging;

namespace SeventySix.Api.Logging;

/// <summary>
/// Custom Serilog sink that writes log events to database using LogRepository.
/// </summary>
/// <remarks>
/// Implements ILogEventSink to capture log events and persist them to the database
/// via our LogRepository. Provides custom exception formatting:
/// - Exception.Message + BaseException.Message (if different) + StackTrace
/// - Filters stack trace to only show our code (SeventySix namespace)
///
/// Performance Considerations:
/// - Batched writes to database (every 5 seconds or 50 events)
/// - Single background task with dedicated connection
/// - Only logs Warning level and above to reduce database I/O
/// - Prevents connection pool exhaustion during high load
/// </remarks>
/// <param name="serviceProvider">
/// Service provider for creating scopes and resolving dependencies.
/// </param>
/// <param name="environment">
/// Optional environment name (e.g., "Production").
/// </param>
/// <param name="machineName">
/// Optional machine or container name.
/// </param>
public sealed class DatabaseLogSink(
	IServiceProvider serviceProvider,
	string? environment = null,
	string? machineName = null) : ILogEventSink, IAsyncDisposable
{
	private readonly ConcurrentQueue<LogEvent> LogQueue = new();
	private readonly SemaphoreSlim ProcessingSemaphore =
		new(1, 1);
	private volatile Timer? BatchTimer;
	private const int BatchSize = 50;
	private const int BatchIntervalMs = 5000;
	private bool Disposed;

	/// <summary>
	/// Ensures the batch timer is initialized.
	/// </summary>
	private void EnsureTimerInitialized()
	{
		if (BatchTimer == null)
		{
			lock (ProcessingSemaphore)
			{
				if (BatchTimer == null)
				{
					BatchTimer =
						new Timer(
							callback: _ => _ = ProcessBatchAsync(),
							state: null,
							dueTime: TimeSpan.FromMilliseconds(BatchIntervalMs),
							period: TimeSpan.FromMilliseconds(BatchIntervalMs));
				}
			}
		}
	}

	/// <inheritdoc/>
	public void Emit(LogEvent logEvent)
	{
		ArgumentNullException.ThrowIfNull(logEvent);

		if (Disposed)
		{
			return;
		}

		// Ensure timer is initialized on first call
		EnsureTimerInitialized();

		// Only log Warning and above to database
		if (logEvent.Level < LogEventLevel.Warning)
		{
			return;
		}

		// Capture Activity context NOW (before queueing) since Activity.Current is AsyncLocal
		// and won't be available in the background thread
		System.Diagnostics.Activity? activity =
			System
			.Diagnostics
			.Activity
			.Current;
		if (
			activity != null
			&& !logEvent.Properties.ContainsKey("__ActivityTraceId"))
		{
			// Create enriched properties dictionary
			Dictionary<string, LogEventPropertyValue> enrichedProperties =
				new(
					logEvent.Properties)
				{
					["__ActivityTraceId"] =
						new ScalarValue(
							activity.TraceId.ToString()),
					["__ActivitySpanId"] =
						new ScalarValue(
							activity.SpanId.ToString()),
					["__ActivityParentSpanId"] =
						new ScalarValue(
							activity.ParentSpanId.ToString()),
				};

			// Create new log event with enriched properties
			logEvent =
				new LogEvent(
					logEvent.Timestamp,
					logEvent.Level,
					logEvent.Exception,
					logEvent.MessageTemplate,
					enrichedProperties.Select(kvp => new LogEventProperty(
						kvp.Key,
						kvp.Value)));
		}

		// Add to queue for batch processing
		LogQueue.Enqueue(logEvent);

		// If batch size reached, trigger immediate processing
		if (LogQueue.Count >= BatchSize)
		{
			_ = ProcessBatchAsync();
		}
	}

	/// <summary>
	/// Processes batched log events asynchronously.
	/// </summary>
	private async Task ProcessBatchAsync(bool isDisposing = false)
	{
		// Wait for semaphore - if disposing, wait indefinitely, otherwise return if busy
		bool acquired =
			isDisposing
			? await ProcessingSemaphore.WaitAsync(TimeSpan.FromSeconds(10))
			: await ProcessingSemaphore.WaitAsync(0);

		if (!acquired || (Disposed && !isDisposing))
		{
			return; // Already processing or disposed
		}

		try
		{
			List<LogEvent> batch =
				new(BatchSize);

			// Dequeue up to BatchSize events
			while (
				batch.Count < BatchSize
				&& LogQueue.TryDequeue(out LogEvent? logEvent))
			{
				batch.Add(logEvent);
			}

			if (batch.Count == 0)
			{
				return;
			}

			// Create a single scope for the entire batch
			using IServiceScope scope = serviceProvider.CreateScope();
			ILogRepository logRepository =
				scope.ServiceProvider.GetRequiredService<ILogRepository>();

			// Process all events in a batch
			foreach (LogEvent logEvent in batch)
			{
				await EmitAsync(logEvent, logRepository);
			}
		}
		finally
		{
			ProcessingSemaphore.Release();
		}
	}

	/// <summary>
	/// Asynchronously persists log event to database using provided repository.
	/// </summary>
	/// <param name="logEvent">
	/// The log event to persist.
	/// </param>
	/// <param name="logRepository">
	/// The log repository to use (shared within batch).
	/// </param>
	private async Task EmitAsync(
		LogEvent logEvent,
		ILogRepository logRepository)
	{
		Log log =
			new()
			{
				LogLevel = logEvent.Level.ToString(),
				Message = logEvent.RenderMessage(),
				CreateDate =
					logEvent.Timestamp.UtcDateTime,
				Environment = environment,
				MachineName = machineName,
			};

		ExtractTraceContext(logEvent, log);
		ExtractExceptionInfo(logEvent, log);
		ExtractHttpContextProperties(logEvent, log);
		ExtractAdditionalProperties(logEvent, log);

		await logRepository.CreateAsync(log);
	}

	/// <summary>
	/// Extracts OpenTelemetry trace context from log event properties.
	/// </summary>
	private static void ExtractTraceContext(LogEvent logEvent, Log log)
	{
		if (
			logEvent.Properties.TryGetValue(
				"__ActivityTraceId",
				out LogEventPropertyValue? traceIdProp))
		{
			log.CorrelationId =
				traceIdProp.ToString().Trim('"');
		}

		if (
			logEvent.Properties.TryGetValue(
				"__ActivitySpanId",
				out LogEventPropertyValue? spanIdProp))
		{
			log.SpanId =
				spanIdProp.ToString().Trim('"');
		}

		if (
			logEvent.Properties.TryGetValue(
				"__ActivityParentSpanId",
				out LogEventPropertyValue? parentSpanIdProp))
		{
			log.ParentSpanId =
				parentSpanIdProp.ToString().Trim('"');
		}

		// Fallback: check for explicitly logged properties
		if (
			string.IsNullOrEmpty(log.CorrelationId)
			&& logEvent.Properties.TryGetValue(
				"TraceId",
				out LogEventPropertyValue? traceIdProperty))
		{
			log.CorrelationId =
				traceIdProperty.ToString().Trim('"');
		}

		if (
			string.IsNullOrEmpty(log.SpanId)
			&& logEvent.Properties.TryGetValue(
				"SpanId",
				out LogEventPropertyValue? spanIdProperty))
		{
			log.SpanId =
				spanIdProperty.ToString().Trim('"');
		}
	}

	/// <summary>
	/// Extracts exception information from log event.
	/// </summary>
	private static void ExtractExceptionInfo(LogEvent logEvent, Log log)
	{
		if (logEvent.Exception != null)
		{
			(
				string? exceptionMessage,
				string? baseExceptionMessage,
				string? stackTrace
			) =
				FormatException(logEvent.Exception);
			log.ExceptionMessage = exceptionMessage;
			log.BaseExceptionMessage =
				baseExceptionMessage;
			log.StackTrace = stackTrace;
		}
	}

	/// <summary>
	/// Extracts HTTP context properties from log event.
	/// </summary>
	private static void ExtractHttpContextProperties(LogEvent logEvent, Log log)
	{
		if (
			logEvent.Properties.TryGetValue(
				"RequestMethod",
				out LogEventPropertyValue? requestMethod))
		{
			log.RequestMethod =
				requestMethod.ToString().Trim('"');
		}

		if (
			logEvent.Properties.TryGetValue(
				"RequestPath",
				out LogEventPropertyValue? requestPath))
		{
			log.RequestPath =
				requestPath.ToString().Trim('"');
		}

		if (
			logEvent.Properties.TryGetValue(
				"StatusCode",
				out LogEventPropertyValue? statusCode) && int.TryParse(
					statusCode.ToString(),
					out int statusCodeValue))
		{
			log.StatusCode = statusCodeValue;
		}

		if (
			logEvent.Properties.TryGetValue(
				"Elapsed",
				out LogEventPropertyValue? elapsed) && decimal.TryParse(
					elapsed.ToString(),
					out decimal elapsedValue))
		{
			log.DurationMs =
				(long)elapsedValue;
		}

		if (
			logEvent.Properties.TryGetValue(
				"SourceContext",
				out LogEventPropertyValue? sourceContext))
		{
			log.SourceContext =
				sourceContext.ToString().Trim('"');
		}
	}

	/// <summary>
	/// Extracts additional properties and stores them as JSON.
	/// </summary>
	private static void ExtractAdditionalProperties(LogEvent logEvent, Log log)
	{
		if (logEvent.Properties.Count > 0)
		{
			StringBuilder properties = new();
			properties.Append('{');
			bool first = true;

			foreach (
				KeyValuePair<
					string,
					LogEventPropertyValue
				> property in logEvent.Properties.Where(
					prop => !IsStandardProperty(prop.Key)))
			{
				if (!first)
				{
					properties.Append(',');
				}

				properties.Append($"\"{property.Key}\":{property.Value}");
				first = false;
			}

			properties.Append('}');
			log.Properties = properties.ToString();
		}
	}
	/// <summary>
	/// Formats exception information according to requirements.
	/// </summary>
	/// <param name="exception">
	/// The exception to format.
	/// </param>
	/// <returns>
	/// Tuple of (ExceptionMessage, BaseExceptionMessage, StackTrace).
	/// </returns>
	private static (
		string? ExceptionMessage,
		string? BaseExceptionMessage,
		string? StackTrace
	) FormatException(Exception exception)
	{
		string exceptionMessage = exception.Message;
		string? baseExceptionMessage = null;
		string? stackTrace = null;

		// Get base exception if different
		Exception baseException = exception.GetBaseException();
		if (
			baseException != exception
			&& baseException.Message != exception.Message)
		{
			baseExceptionMessage = baseException.Message;
		}

		// Filter stack trace to only show our code (SeventySix namespace)
		if (exception.StackTrace != null)
		{
			string[] lines =
				exception.StackTrace.Split(
					['\r', '\n'],
					StringSplitOptions.RemoveEmptyEntries);
			List<string> ourLines =
				[
				.. lines.Where(line => line.Contains("SeventySix")),
			];

			// If no SeventySix-specific lines found, include all (edge case)
			stackTrace =
				ourLines.Count > 0
					? string.Join(System.Environment.NewLine, ourLines)
					: exception.StackTrace;
		}

		return (exceptionMessage, baseExceptionMessage, stackTrace);
	}

	/// <summary>
	/// Checks if a property is a standard HTTP/logging property.
	/// </summary>
	/// <param name="propertyName">
	/// The property name to check.
	/// </param>
	/// <returns>
	/// True if standard property, false otherwise.
	/// </returns>
	private static bool IsStandardProperty(string propertyName)
	{
		return propertyName switch
		{
			"RequestMethod" => true,
			"RequestPath" => true,
			"StatusCode" => true,
			"Elapsed" => true,
			"SourceContext" => true,
			"MachineName" => true,
			"ThreadId" => true,
			"ProcessId" => true,
			"TraceId" => true,
			"SpanId" => true,
			"ParentSpanId" => true,
			"__ActivityTraceId" => true,
			"__ActivitySpanId" => true,
			"__ActivityParentSpanId" => true,
			_ => false,
		};
	}

	/// <summary>
	/// Disposes resources and flushes remaining logs asynchronously.
	/// </summary>
	public async ValueTask DisposeAsync()
	{
		if (Disposed)
		{
			return;
		}

		Disposed = true;

		// Stop the timer if initialized
		if (BatchTimer != null)
		{
			await BatchTimer.DisposeAsync();
		}

		// Flush remaining logs asynchronously
		await ProcessBatchAsync(isDisposing: true);

		ProcessingSemaphore?.Dispose();

		GC.SuppressFinalize(this);
	}
}