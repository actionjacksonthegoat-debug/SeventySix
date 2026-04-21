// <copyright file="LogProperties.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Logging;

/// <summary>
/// Canonical property-name constants for structured logging.
/// All Serilog enrichers, sinks, and log statements reference these
/// constants to guarantee consistent casing and avoid typo-driven
/// downstream query breakage.
/// </summary>
public static class LogProperties
{
	// ── Trace context ────────────────────────────────────────────

	/// <summary>OpenTelemetry Activity trace ID (internal enricher key).</summary>
	public const string ActivityTraceId = "__ActivityTraceId";

	/// <summary>OpenTelemetry Activity span ID (internal enricher key).</summary>
	public const string ActivitySpanId = "__ActivitySpanId";

	/// <summary>OpenTelemetry Activity parent span ID (internal enricher key).</summary>
	public const string ActivityParentSpanId = "__ActivityParentSpanId";

	/// <summary>W3C trace ID (fallback when Activity is not present).</summary>
	public const string TraceId = "TraceId";

	/// <summary>W3C span ID (fallback when Activity is not present).</summary>
	public const string SpanId = "SpanId";

	/// <summary>W3C parent span ID.</summary>
	public const string ParentSpanId = "ParentSpanId";

	// ── HTTP context ─────────────────────────────────────────────

	/// <summary>HTTP method of the current request.</summary>
	public const string RequestMethod = "RequestMethod";

	/// <summary>Request path of the current request.</summary>
	public const string RequestPath = "RequestPath";

	/// <summary>HTTP response status code.</summary>
	public const string StatusCode = "StatusCode";

	/// <summary>Request elapsed time in milliseconds.</summary>
	public const string Elapsed = "Elapsed";

	/// <summary>Serilog source context (typically the class name).</summary>
	public const string SourceContext = "SourceContext";

	// ── Infrastructure ───────────────────────────────────────────

	/// <summary>Machine or container hostname.</summary>
	public const string MachineName = "MachineName";

	/// <summary>Thread ID of the logging thread.</summary>
	public const string ThreadId = "ThreadId";

	/// <summary>Process ID of the host process.</summary>
	public const string ProcessId = "ProcessId";
}