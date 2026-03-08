import { trace } from "@opentelemetry/api";
import { isPresent } from "@shared/utilities/null-check.utility";

const INVALID_TRACE_ID: string = "00000000000000000000000000000000";

/**
 * Returns the current OpenTelemetry trace ID if an active span exists,
 * otherwise returns null so the server can use its own trace ID.
 * Used by ClientErrorLoggerService and LoggerService for trace correlation.
 * @returns {string | null}
 * A 32-character lowercase hexadecimal trace ID, or null if no active span.
 */
export function getTraceCorrelationId(): string | null
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
		// OTEL API not initialized — fall through
	}

	return null;
}