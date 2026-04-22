import { toSafeLogPayload } from "@seventysixcommerce/shared/logging";
import type { SafeErrorPayload } from "@seventysixcommerce/shared/logging";
import { generateTraceContext, parseTraceparent } from "@seventysixcommerce/shared/observability";
import type { TraceContext } from "@seventysixcommerce/shared/observability";
import {
	createStartHandler,
	defaultStreamHandler
} from "@tanstack/react-start/server";
import { configureLogForwarder, queueLog } from "~/server/log-forwarder";
import { initTelemetry } from "~/server/telemetry";

// Configure log forwarding on server startup
configureLogForwarder(process.env.SEVENTYSIX_API_URL ?? "");

// Initialize OpenTelemetry if endpoint is configured
initTelemetry(process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "");

const handler: ReturnType<typeof createStartHandler> =
	createStartHandler(defaultStreamHandler);

export default {
	async fetch(request: Request): Promise<Response>
	{
		const traceContext: TraceContext =
			parseTraceparent(request.headers.get("traceparent"))
				?? generateTraceContext();

		try
		{
			const response: Response =
				await handler(request);

			response.headers.set("X-Content-Type-Options", "nosniff");
			response.headers.set("X-Frame-Options", "DENY");
			response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
			response.headers.set(
				"Permissions-Policy",
				"camera=(), microphone=(), geolocation=()");
			// TanStack Start emits inline hydration/scroll-restoration scripts that
			// cannot use nonces yet, so 'unsafe-inline' is required for script-src.
			response.headers.set(
				"Content-Security-Policy",
				"default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
			response.headers.set(
				"Cross-Origin-Embedder-Policy",
				"credentialless");
			response.headers.set(
				"Cache-Control",
				"no-store");

			return response;
		}
		catch (error: unknown)
		{
			const url: URL =
				new URL(request.url);
			const safePayload: SafeErrorPayload =
				toSafeLogPayload(error);

			queueLog(
				{
					logLevel: "Error",
					message: safePayload.message,
					exceptionMessage: `[${safePayload.code}] ${safePayload.correlationId}`,
					requestUrl: url.pathname,
					requestMethod: request.method,
					traceId: traceContext.traceId,
					spanId: traceContext.spanId
				});

			throw error;
		}
	}
};