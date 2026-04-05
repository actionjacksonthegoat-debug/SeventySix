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
			queueLog(
				{
					logLevel: "Error",
					message: error instanceof Error ? error.message : String(error),
					exceptionMessage: error instanceof Error ? error.message : undefined,
					stackTrace: error instanceof Error ? error.stack : undefined,
					requestUrl: url.pathname,
					requestMethod: request.method
				});

			throw error;
		}
	}
};