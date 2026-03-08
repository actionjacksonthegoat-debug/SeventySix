import { trace } from "@opentelemetry/api";
import { isPresent } from "@shared/utilities/null-check.utility";

const INVALID_TRACE_ID: string = "00000000000000000000000000000000";

/**
 * Returns the current OpenTelemetry trace ID if an active span exists,
 * otherwise generates a random 32-character hex string for correlation.
 * Used by ClientErrorLoggerService and LoggerService for trace correlation.
 * @returns {string}
 * A 32-character lowercase hexadecimal string.
 */
export function getTraceCorrelationId(): string
{
	try
	{
		const activeSpan: ReturnType<typeof trace.getActiveSpan> =
			trace.getActiveSpan();
		const traceId: string | undefined =
			activeSpan?.spanContext().traceId;

		if (isPresent(traceId) && traceId !== INVALID_TRACE_ID)
		{
			return traceId;
		}
	}
	catch
	{
		// OTEL API not initialized — fall through to random generation
	}

	const bytes: Uint8Array =
		new Uint8Array(16);
	crypto.getRandomValues(bytes);

	return Array
		.from(bytes)
		.map((byte) =>
			byte
				.toString(16)
				.padStart(2, "0"))
		.join("");
}