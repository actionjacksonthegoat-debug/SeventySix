// <copyright file="DatabaseLogSink.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

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
///
/// SOLID Principles:
/// - SRP: Only responsible for formatting and persisting log events
/// - DIP: Depends on ILogRepository abstraction
///
/// Performance Considerations:
/// - Async writes to database
/// - Batch processing via PeriodicBatching sink wrapper
/// - Only logs Warning level and above to reduce database I/O
/// </remarks>
public class DatabaseLogSink : ILogEventSink
{
	private readonly IServiceProvider ServiceProvider;
	private readonly string? Environment;
	private readonly string? MachineName;

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
	}

	/// <inheritdoc/>
	public void Emit(LogEvent logEvent)
	{
		ArgumentNullException.ThrowIfNull(logEvent);

		// Only log Warning and above to database
		if (logEvent.Level < LogEventLevel.Warning)
		{
			return;
		}

		// Use async task to prevent blocking
		_ = Task.Run(async () => await EmitAsync(logEvent));
	}

	/// <summary>
	/// Asynchronously persists log event to database.
	/// </summary>
	/// <param name="logEvent">The log event to persist.</param>
	private async Task EmitAsync(LogEvent logEvent)
	{
		try
		{
			// Create scope to resolve scoped services (DbContext)
			using var scope = ServiceProvider.CreateScope();
			var logRepository = scope.ServiceProvider.GetRequiredService<ILogRepository>();

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

			// Persist to database
			await logRepository.CreateAsync(log);
		}
		catch (Exception ex)
		{
			// Don't throw - log to console to avoid infinite loop
			Console.WriteLine($"[DatabaseLogSink] Error writing log to database: {ex.Message}");
		}
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
}