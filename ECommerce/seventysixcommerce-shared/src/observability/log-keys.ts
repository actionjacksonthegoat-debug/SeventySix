/**
 * Canonical log property-name constants for the SeventySix Commerce apps.
 * Mirrors the server-side `LogProperties` class so that downstream
 * Loki / Grafana queries can rely on consistent casing across services.
 *
 * @module log-keys
 */

// ── Trace context ────────────────────────────────────────────────

/** W3C trace ID extracted from the `traceparent` header. */
export const TRACE_ID: string = "TraceId";

/** W3C span ID for the current request. */
export const SPAN_ID: string = "SpanId";

/** Correlation ID (aliased to trace ID for cross-service joins). */
export const CORRELATION_ID: string = "CorrelationId";

// ── HTTP context ─────────────────────────────────────────────────

/** HTTP method of the current request. */
export const REQUEST_METHOD: string = "RequestMethod";

/** Request path / URL of the current request. */
export const REQUEST_PATH: string = "RequestPath";

/** HTTP response status code. */
export const STATUS_CODE: string = "StatusCode";

/** Request elapsed time in milliseconds. */
export const ELAPSED: string = "Elapsed";

/** Source context (typically the module or service name). */
export const SOURCE_CONTEXT: string = "SourceContext";

// ── Infrastructure ───────────────────────────────────────────────

/** Machine or container hostname. */
export const MACHINE_NAME: string = "MachineName";