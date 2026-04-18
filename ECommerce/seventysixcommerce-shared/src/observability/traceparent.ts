/**
 * W3C Trace Context `traceparent` header utilities.
 * Parses and generates traceparent values so commerce apps can
 * correlate request logs with distributed traces.
 *
 * @see https://www.w3.org/TR/trace-context/#traceparent-header
 * @module traceparent
 */

/** Parsed components of a W3C `traceparent` header. */
export interface TraceContext
{
	/** The 16-byte hex-encoded trace ID. */
	traceId: string;

	/** The 8-byte hex-encoded parent span ID. */
	spanId: string;
}

/** Regex matching a valid `traceparent` header value. */
const TRACEPARENT_PATTERN: RegExp =
	/^00-([0-9a-f]{32})-([0-9a-f]{16})-[0-9a-f]{2}$/;

/**
 * Parses a W3C `traceparent` header value into its trace and span IDs.
 * Returns `undefined` if the value is missing, malformed, or uses an
 * unsupported version.
 *
 * @param header - The raw `traceparent` header value.
 * @returns The parsed trace context, or `undefined` if invalid.
 */
export function parseTraceparent(header: string | null | undefined): TraceContext | undefined
{
	if (header === null || header === undefined || header === "")
	{
		return undefined;
	}

	const match: RegExpMatchArray | null =
		header.match(TRACEPARENT_PATTERN);

	if (match === null)
	{
		return undefined;
	}

	return {
		traceId: match[1],
		spanId: match[2],
	};
}

/**
 * Generates a new random trace context suitable for creating a fresh
 * `traceparent` header when no incoming header is present.
 *
 * @returns A new trace context with random trace and span IDs.
 */
export function generateTraceContext(): TraceContext
{
	return {
		traceId: crypto.randomUUID().replace(/-/g, ""),
		spanId: crypto.randomUUID().replace(/-/g, "").slice(0, 16),
	};
}
