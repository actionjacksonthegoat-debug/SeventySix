import { toSafeLogPayload } from "@seventysixcommerce/shared/logging";
import type { SafeErrorPayload } from "@seventysixcommerce/shared/logging";
import { generateTraceContext, parseTraceparent } from "@seventysixcommerce/shared/observability";
import type { TraceContext } from "@seventysixcommerce/shared/observability";
import {
	createStartHandler,
	defaultStreamHandler
} from "@tanstack/react-start/server";
import { randomBytes } from "node:crypto";
import { configureLogForwarder, queueLog } from "~/server/log-forwarder";
import { initTelemetry } from "~/server/telemetry";

// Configure log forwarding on server startup
configureLogForwarder(process.env.SEVENTYSIX_API_URL ?? "");

// Initialize OpenTelemetry if endpoint is configured
initTelemetry(process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "");

/**
 * Creates a cryptographically random CSP nonce for a single HTTP response.
 * @returns {string}
 * Base64 nonce string for CSP script/style directives.
 */
function createCspNonce(): string
{
	return randomBytes(16)
		.toString("base64");
}

/**
 * Builds a strict CSP for SSR responses that include nonce-decorated inline scripts/styles.
 * @param {string} nonce
 * Per-response CSP nonce value.
 * @returns {string}
 * Serialized Content-Security-Policy header value.
 */
function buildContentSecurityPolicy(nonce: string): string
{
	return [
		"default-src 'self'",
		"base-uri 'self'",
		"form-action 'self'",
		"object-src 'none'",
		"frame-ancestors 'none'",
		"upgrade-insecure-requests",
		`script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com`,
		"script-src-attr 'none'",
		`style-src 'self' 'nonce-${nonce}'`,
		"style-src-attr 'none'",
		"img-src 'self' data:",
		"font-src 'self'",
		"connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com"
	]
		.join("; ");
}

const startHandler: ReturnType<typeof createStartHandler> =
	createStartHandler(
		async ({ request, router, responseHeaders }): Promise<Response> =>
		{
			const cspNonce: string =
				createCspNonce();

			router.update(
				{
					ssr: {
						nonce: cspNonce
					}
				});

			const response: Response =
				await defaultStreamHandler(
					{
						request,
						router,
						responseHeaders
					});

			response.headers.set(
				"Content-Security-Policy",
				buildContentSecurityPolicy(cspNonce));

			return response;
		});

export default {
	async fetch(request: Request): Promise<Response>
	{
		const traceContext: TraceContext =
			parseTraceparent(request.headers.get("traceparent"))
				?? generateTraceContext();

		try
		{
			const response: Response =
				await startHandler(request);

			response.headers.set("X-Content-Type-Options", "nosniff");
			response.headers.set("X-Frame-Options", "DENY");
			response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
			response.headers.set(
				"Permissions-Policy",
				"camera=(), microphone=(), geolocation=()");
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