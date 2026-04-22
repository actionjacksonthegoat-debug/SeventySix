// <copyright file="LogEventEnricher.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Text;
using Serilog.Events;
using SeventySix.Logging;

namespace SeventySix.Api.Logging;

/// <summary>
/// Converts a Serilog <see cref="LogEvent"/> into a persistence-ready
/// <see cref="Log"/> entity.
/// </summary>
/// <remarks>
/// Extracted from <see cref="DatabaseLogSink"/> to isolate the pure
/// property-extraction / exception-formatting logic from the I/O and
/// batching concerns. All members are pure functions and therefore
/// trivially unit-testable without a service provider or database.
/// </remarks>
public static class LogEventEnricher
{
	/// <summary>
	/// Builds a fully populated <see cref="Log"/> entity from a Serilog event.
	/// </summary>
	/// <param name="logEvent">
	/// The Serilog event to enrich.
	/// </param>
	/// <param name="environment">
	/// Optional environment name (e.g., "Production").
	/// </param>
	/// <param name="machineName">
	/// Optional machine or container name.
	/// </param>
	/// <returns>
	/// A <see cref="Log"/> entity with trace context, exception info, HTTP
	/// properties, and additional properties populated.
	/// </returns>
	public static Log BuildLog(
		LogEvent logEvent,
		string? environment,
		string? machineName)
	{
		ArgumentNullException.ThrowIfNull(logEvent);

		Log log =
			new()
			{
				LogLevel = logEvent.Level.ToString(),
				Message = logEvent.RenderMessage(),
				CreateDate = logEvent.Timestamp.UtcDateTime,
				Environment = environment,
				MachineName = machineName,
			};

		ExtractTraceContext(logEvent, log);
		ExtractExceptionInfo(logEvent, log);
		ExtractHttpContextProperties(logEvent, log);
		ExtractAdditionalProperties(logEvent, log);

		return log;
	}

	/// <summary>
	/// Extracts OpenTelemetry trace context from log event properties.
	/// </summary>
	/// <param name="logEvent">
	/// The Serilog event.
	/// </param>
	/// <param name="log">
	/// The target log entity.
	/// </param>
	private static void ExtractTraceContext(LogEvent logEvent, Log log)
	{
		if (logEvent.Properties.TryGetValue(
			LogProperties.ActivityTraceId,
			out LogEventPropertyValue? traceIdProp))
		{
			log.CorrelationId =
				traceIdProp.ToString().Trim('"');
		}

		if (logEvent.Properties.TryGetValue(
			LogProperties.ActivitySpanId,
			out LogEventPropertyValue? spanIdProp))
		{
			log.SpanId =
				spanIdProp.ToString().Trim('"');
		}

		if (logEvent.Properties.TryGetValue(
			LogProperties.ActivityParentSpanId,
			out LogEventPropertyValue? parentSpanIdProp))
		{
			log.ParentSpanId =
				parentSpanIdProp.ToString().Trim('"');
		}

		if (string.IsNullOrEmpty(log.CorrelationId)
			&& logEvent.Properties.TryGetValue(
				LogProperties.TraceId,
				out LogEventPropertyValue? traceIdProperty))
		{
			log.CorrelationId =
				traceIdProperty.ToString().Trim('"');
		}

		if (string.IsNullOrEmpty(log.SpanId)
			&& logEvent.Properties.TryGetValue(
				LogProperties.SpanId,
				out LogEventPropertyValue? spanIdProperty))
		{
			log.SpanId =
				spanIdProperty.ToString().Trim('"');
		}
	}

	/// <summary>
	/// Extracts exception information from log event.
	/// </summary>
	/// <param name="logEvent">
	/// The Serilog event.
	/// </param>
	/// <param name="log">
	/// The target log entity.
	/// </param>
	private static void ExtractExceptionInfo(LogEvent logEvent, Log log)
	{
		if (logEvent.Exception == null)
		{
			return;
		}

		(
			string? exceptionMessage,
			string? baseExceptionMessage,
			string? stackTrace
		) =
			FormatException(logEvent.Exception);

		log.ExceptionMessage =
			exceptionMessage;
		log.BaseExceptionMessage =
			baseExceptionMessage;
		log.StackTrace =
			stackTrace;
	}

	/// <summary>
	/// Extracts HTTP context properties from log event.
	/// </summary>
	/// <param name="logEvent">
	/// The Serilog event.
	/// </param>
	/// <param name="log">
	/// The target log entity.
	/// </param>
	private static void ExtractHttpContextProperties(LogEvent logEvent, Log log)
	{
		if (logEvent.Properties.TryGetValue(
			LogProperties.RequestMethod,
			out LogEventPropertyValue? requestMethod))
		{
			log.RequestMethod =
				requestMethod.ToString().Trim('"');
		}

		if (logEvent.Properties.TryGetValue(
			LogProperties.RequestPath,
			out LogEventPropertyValue? requestPath))
		{
			log.RequestPath =
				requestPath.ToString().Trim('"');
		}

		if (logEvent.Properties.TryGetValue(
			LogProperties.StatusCode,
			out LogEventPropertyValue? statusCode)
			&& int.TryParse(
				statusCode.ToString(),
				out int statusCodeValue))
		{
			log.StatusCode = statusCodeValue;
		}

		if (logEvent.Properties.TryGetValue(
			LogProperties.Elapsed,
			out LogEventPropertyValue? elapsed)
			&& decimal.TryParse(
				elapsed.ToString(),
				out decimal elapsedValue))
		{
			log.DurationMs =
				(long)elapsedValue;
		}

		if (logEvent.Properties.TryGetValue(
			LogProperties.SourceContext,
			out LogEventPropertyValue? sourceContext))
		{
			log.SourceContext =
				sourceContext.ToString().Trim('"');
		}
	}

	/// <summary>
	/// Extracts additional properties and stores them as JSON.
	/// </summary>
	/// <param name="logEvent">
	/// The Serilog event.
	/// </param>
	/// <param name="log">
	/// The target log entity.
	/// </param>
	private static void ExtractAdditionalProperties(LogEvent logEvent, Log log)
	{
		if (logEvent.Properties.Count == 0)
		{
			return;
		}

		StringBuilder properties = new();
		properties.Append('{');
		bool first = true;

		foreach (KeyValuePair<string, LogEventPropertyValue> property
			in logEvent.Properties.Where(
				prop => !IsStandardProperty(prop.Key)))
		{
			if (!first)
			{
				properties.Append(',');
			}

			string renderedValue =
				SensitiveFieldRedactor.SensitiveKeys.Contains(property.Key)
					? $"\"{SensitiveFieldRedactor.RedactedValue}\""
					: property.Value.ToString();

			properties.Append($"\"{property.Key}\":{renderedValue}");
			first = false;
		}

		properties.Append('}');
		log.Properties = properties.ToString();
	}

	/// <summary>
	/// Formats exception information (message, base exception, filtered stack).
	/// </summary>
	/// <param name="exception">
	/// The exception to format.
	/// </param>
	/// <returns>
	/// Tuple of (ExceptionMessage, BaseExceptionMessage, StackTrace filtered
	/// to SeventySix frames).
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

		Exception baseException = exception.GetBaseException();
		if (baseException != exception
			&& baseException.Message != exception.Message)
		{
			baseExceptionMessage = baseException.Message;
		}

		if (exception.StackTrace != null)
		{
			string[] lines =
				exception.StackTrace.Split(
					['\r', '\n'],
					StringSplitOptions.RemoveEmptyEntries);

			List<string> ourLines =
				[.. lines.Where(line => line.Contains("SeventySix"))];

			stackTrace =
				ourLines.Count > 0
					? string.Join(System.Environment.NewLine, ourLines)
					: exception.StackTrace;
		}

		return (exceptionMessage, baseExceptionMessage, stackTrace);
	}

	/// <summary>
	/// Checks if a property is a standard HTTP / logging property that is
	/// already modelled on the <see cref="Log"/> entity.
	/// </summary>
	/// <param name="propertyName">
	/// The property name to check.
	/// </param>
	/// <returns>
	/// True if the property is standard and should not be serialized into
	/// the additional-properties JSON blob.
	/// </returns>
	private static bool IsStandardProperty(string propertyName)
	{
		return propertyName switch
		{
			LogProperties.RequestMethod => true,
			LogProperties.RequestPath => true,
			LogProperties.StatusCode => true,
			LogProperties.Elapsed => true,
			LogProperties.SourceContext => true,
			LogProperties.MachineName => true,
			LogProperties.ThreadId => true,
			LogProperties.ProcessId => true,
			LogProperties.TraceId => true,
			LogProperties.SpanId => true,
			LogProperties.ParentSpanId => true,
			LogProperties.ActivityTraceId => true,
			LogProperties.ActivitySpanId => true,
			LogProperties.ActivityParentSpanId => true,
			_ => false,
		};
	}
}