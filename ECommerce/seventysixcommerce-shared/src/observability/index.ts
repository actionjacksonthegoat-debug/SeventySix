/**
 * Observability barrel export.
 * Re-exports log forwarding, metrics factory functions, canonical log keys,
 * OTel resource builder, and payload redaction utilities.
 */
export { createLogForwarder } from "./log-forwarder";
export type { LogEntry, LogForwarder } from "./log-forwarder";
export * from "./log-keys";
export { createCommerceMetrics } from "./metrics";
export type { CommerceMetrics } from "./metrics";
export { buildResource } from "./otel-resource";
export type { OtelResourceOptions } from "./otel-resource";
export { redactPayload, REDACTED_VALUE } from "./redact";
export { generateTraceContext, parseTraceparent } from "./traceparent";
export type { TraceContext } from "./traceparent";