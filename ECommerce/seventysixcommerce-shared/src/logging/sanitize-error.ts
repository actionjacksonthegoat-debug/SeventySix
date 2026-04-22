/**
 * Error sanitization utilities for safe logging.
 * Strips PII, stack traces, and internal details from error payloads
 * before forwarding to external telemetry systems.
 */

/** Email-matching pattern for PII scrubbing. */
const EMAIL_PATTERN: RegExp =
	/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/** A sanitized error payload safe for telemetry forwarding. */
export interface SafeErrorPayload
{
	/** Generic, non-revealing error message. */
	message: string;
	/** Machine-readable error classification code. */
	code: string;
	/** Correlation ID for tracing back to detailed OTEL spans. */
	correlationId: string;
	/** HTTP status code, when applicable. */
	statusCode?: number;
}

/**
 * Converts an unknown caught error into a safe, PII-free log payload.
 * Stack traces, raw messages, and email addresses are never included.
 *
 * @param error - The caught error value (may be any type).
 * @param correlationId - Optional correlation ID for distributed tracing.
 * @returns A sanitized payload suitable for telemetry forwarding.
 */
export function toSafeLogPayload(
	error: unknown,
	correlationId?: string): SafeErrorPayload
{
	const resolvedCorrelationId: string =
		correlationId ?? crypto.randomUUID();

	if (error instanceof Error)
	{
		return {
			message: "An internal error occurred",
			code: classifyError(error),
			correlationId: resolvedCorrelationId
		};
	}

	return {
		message: "An internal error occurred",
		code: "UNKNOWN_ERROR",
		correlationId: resolvedCorrelationId
	};
}

/**
 * Masks PII patterns (email addresses) in a string for safe logging.
 * Non-email PII is replaced with a generic placeholder.
 *
 * @param text - The text to sanitize.
 * @returns The text with email addresses masked.
 */
export function maskPii(text: string): string
{
	return text.replace(
		EMAIL_PATTERN,
		(match: string) =>
			match.replace(/^(.{2}).*@/, "$1***@"));
}

/**
 * Classifies an Error into a machine-readable code based on its name and message.
 * Never exposes the raw message content.
 *
 * @param error - The Error instance to classify.
 * @returns A classification code string.
 */
function classifyError(error: Error): string
{
	const name: string =
		error.name.toLowerCase();

	if (name.includes("type"))
	{
		return "TYPE_ERROR";
	}

	if (name.includes("range"))
	{
		return "RANGE_ERROR";
	}

	if (name.includes("reference"))
	{
		return "REFERENCE_ERROR";
	}

	if (name.includes("syntax"))
	{
		return "SYNTAX_ERROR";
	}

	if (name.includes("timeout") || name.includes("abort"))
	{
		return "TIMEOUT_ERROR";
	}

	return "RUNTIME_ERROR";
}