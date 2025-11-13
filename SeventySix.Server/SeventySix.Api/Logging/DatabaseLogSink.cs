// <copyright file="DatabaseLogSink.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Concurrent;
using System.Text;
using Serilog.Core;
using Serilog.Events;
using SeventySix.Core.Entities;
using SeventySix.Core.Interfaces;

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
/// Design Patterns:
/// - Sink: Custom log event processor
/// - Repository: Uses ILogRepository for data access
/// - Producer-Consumer: Batches log events to prevent connection pool exhaustion
///
/// SOLID Principles:
/// - SRP: Only responsible for formatting and persisting log events
/// - DIP: Depends on ILogRepository abstraction
///
/// Performance Considerations:
/// - Batched writes to database (every 5 seconds or 50 events)
/// - Single background task with dedicated connection
/// - Only logs Warning level and above to reduce database I/O
/// - Prevents connection pool exhaustion during high load
/// </remarks>
public class DatabaseLogSink : ILogEventSink, IAsyncDisposable
{
	private readonly IServiceProvider ServiceProvider;
	private readonly string? Environment;
	private readonly string? MachineName;
	private readonly ConcurrentQueue<LogEvent> LogQueue = new();
	private readonly Timer BatchTimer;
	private readonly SemaphoreSlim ProcessingSemaphore = new(1, 1);
	private const int BatchSize = 50;
	private const int BatchIntervalMs = 5000;
	private bool _disposed;

	/// <summary>
	/// Initializes a new instance of the <see cref="DatabaseLogSink"/> class.
	/// </summary>
	/// <param name="serviceProvider">Service provider for resolving scoped services.</param>
	/// <param name="environment">Application environment (Development, Production, etc.).</param>
	/// <param name="machineName">Machine/container name.</param>
	public DatabaseLogSink(
		IServiceProvider serviceProvider,
		string? environment = null,
		string? machineName = null)
	{
		ServiceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));
		Environment = environment;
		MachineName = machineName;

		// Start batch processing timer
		BatchTimer = new Timer(
			callback: _ => _ = ProcessBatchAsync(),
			state: null,
			dueTime: TimeSpan.FromMilliseconds(BatchIntervalMs),
			period: TimeSpan.FromMilliseconds(BatchIntervalMs));
	}

	/// <inheritdoc/>
	public void Emit(LogEvent logEvent)
	{
		ArgumentNullException.ThrowIfNull(logEvent);

		if (_disposed)
		{
			return;
		}

		// Only log Warning and above to database
		if (logEvent.Level < LogEventLevel.Warning)
		{
			return;
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
		var acquired = isDisposing
			? await ProcessingSemaphore.WaitAsync(TimeSpan.FromSeconds(10))
			: await ProcessingSemaphore.WaitAsync(0);

		if (!acquired || (_disposed && !isDisposing))
		{
			return; // Already processing or disposed
		}

		try
		{
			var batch = new List<LogEvent>(BatchSize);

			// Dequeue up to BatchSize events
			while (batch.Count < BatchSize && LogQueue.TryDequeue(out var logEvent))
			{
				batch.Add(logEvent);
			}

			if (batch.Count == 0)
			{
				return;
			}

			// Create a single scope for the entire batch
			using var scope = ServiceProvider.CreateScope();
			var logRepository = scope.ServiceProvider.GetRequiredService<ILogRepository>();

			// Process all events in batch
			foreach (var logEvent in batch)
			{
				try
				{
					await EmitAsync(logEvent, logRepository);
				}
				catch (Exception ex)
				{
					// Don't throw - log to console to avoid infinite loop
					Console.WriteLine($"[DatabaseLogSink] Error writing log to database: {ex.Message}");
				}
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
	/// <param name="logEvent">The log event to persist.</param>
	/// <param name="logRepository">The log repository to use (shared within batch).</param>
	private async Task EmitAsync(LogEvent logEvent, ILogRepository logRepository)
	{
		var log = new Log
		{
			LogLevel = logEvent.Level.ToString(),
			Message = logEvent.RenderMessage(),
			Timestamp = logEvent.Timestamp.UtcDateTime,
			Environment = Environment,
			MachineName = MachineName,
		};

		// Extract exception information
		if (logEvent.Exception != null)
		{
			var (exceptionMessage, baseExceptionMessage, stackTrace) = FormatException(logEvent.Exception);
			log.ExceptionMessage = exceptionMessage;
			log.BaseExceptionMessage = baseExceptionMessage;
			log.StackTrace = stackTrace;
		}

		// Extract HTTP context properties if available
		if (logEvent.Properties.TryGetValue("RequestMethod", out var requestMethod))
		{
			log.RequestMethod = requestMethod.ToString().Trim('"');
		}

		if (logEvent.Properties.TryGetValue("RequestPath", out var requestPath))
		{
			log.RequestPath = requestPath.ToString().Trim('"');
		}

		if (logEvent.Properties.TryGetValue("StatusCode", out var statusCode) &&
			int.TryParse(statusCode.ToString(), out var statusCodeValue))
		{
			log.StatusCode = statusCodeValue;
		}

		if (logEvent.Properties.TryGetValue("Elapsed", out var elapsed) &&
			double.TryParse(elapsed.ToString(), out var elapsedValue))
		{
			log.DurationMs = (long)elapsedValue;
		}

		if (logEvent.Properties.TryGetValue("SourceContext", out var sourceContext))
		{
			log.SourceContext = sourceContext.ToString().Trim('"');
		}

		// Store additional properties as JSON
		if (logEvent.Properties.Count > 0)
		{
			var properties = new StringBuilder();
			properties.Append('{');
			var first = true;

			foreach (var property in logEvent.Properties)
			{
				if (!IsStandardProperty(property.Key))
				{
					if (!first)
					{
						properties.Append(',');
					}

					properties.Append($"\"{property.Key}\":{property.Value}");
					first = false;
				}
			}

			properties.Append('}');
			log.Properties = properties.ToString();
		}

		// Persist to database (using shared DbContext from batch scope)
		await logRepository.CreateAsync(log);
	}

	/// <summary>
	/// Formats exception information according to requirements.
	/// </summary>
	/// <param name="exception">The exception to format.</param>
	/// <returns>Tuple of (ExceptionMessage, BaseExceptionMessage, StackTrace).</returns>
	private static (string? ExceptionMessage, string? BaseExceptionMessage, string? StackTrace) FormatException(Exception exception)
	{
		var exceptionMessage = exception.Message;
		string? baseExceptionMessage = null;
		string? stackTrace = null;

		// Get base exception if different
		var baseException = exception.GetBaseException();
		if (baseException != exception && baseException.Message != exception.Message)
		{
			baseExceptionMessage = baseException.Message;
		}

		// Filter stack trace to only show our code (SeventySix namespace)
		if (exception.StackTrace != null)
		{
			var lines = exception.StackTrace.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
			var ourLines = lines.Where(line => line.Contains("SeventySix")).ToList();

			if (ourLines.Count > 0)
			{
				stackTrace = string.Join(System.Environment.NewLine, ourLines);
			}
			else
			{
				// If no SeventySix lines found, include all (edge case)
				stackTrace = exception.StackTrace;
			}
		}

		return (exceptionMessage, baseExceptionMessage, stackTrace);
	}

	/// <summary>
	/// Checks if a property is a standard HTTP/logging property.
	/// </summary>
	/// <param name="propertyName">The property name to check.</param>
	/// <returns>True if standard property, false otherwise.</returns>
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
			_ => false,
		};
	}

	/// <summary>
	/// Disposes resources and flushes remaining logs asynchronously.
	/// </summary>
	public async ValueTask DisposeAsync()
	{
		if (_disposed)
		{
			return;
		}

		_disposed = true;

		// Stop the timer
		await BatchTimer.DisposeAsync();

		// Flush remaining logs asynchronously
		await ProcessBatchAsync(isDisposing: true);

		ProcessingSemaphore?.Dispose();
	}
}