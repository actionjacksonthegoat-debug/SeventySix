/**
 * Logging barrel export.
 * Re-exports error sanitization utilities for safe telemetry forwarding.
 */
export { maskPii, toSafeLogPayload } from "./sanitize-error";
export type { SafeErrorPayload } from "./sanitize-error";
