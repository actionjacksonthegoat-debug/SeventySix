import { env } from "$env/dynamic/private";
import { CART_SESSION_COOKIE, CART_SESSION_MAX_AGE_SECONDS } from "$lib/constants";
import { configureLogForwarder, queueLog } from "$lib/server/log-forwarder";
import { initTelemetry } from "$lib/server/telemetry";
import { toSafeLogPayload } from "@seventysixcommerce/shared/logging";
import type { SafeErrorPayload } from "@seventysixcommerce/shared/logging";
import { generateTraceContext, parseTraceparent } from "@seventysixcommerce/shared/observability";
import type { TraceContext } from "@seventysixcommerce/shared/observability";
import { isNullOrUndefined } from "@seventysixcommerce/shared/utils";
import type { Handle, HandleServerError } from "@sveltejs/kit";

// Configure log forwarding on module load
configureLogForwarder(env.SEVENTYSIX_API_URL ?? "");

// Initialize OpenTelemetry if endpoint is configured
initTelemetry(env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "");

/**
 * Server hooks — runs on every request.
 * Manages anonymous cart session via HTTP-only cookie and extracts
 * W3C trace context for distributed tracing correlation.
 * SvelteKit provides built-in CSRF protection for form actions.
 */
export const handle: Handle =
	async ({ event, resolve }) =>
	{
		const traceContext: TraceContext =
			parseTraceparent(event.request.headers.get("traceparent"))
				?? generateTraceContext();

		event.locals.traceId =
			traceContext.traceId;
		event.locals.spanId =
			traceContext.spanId;

		let sessionId: string | undefined =
			event.cookies.get(CART_SESSION_COOKIE);

		if (isNullOrUndefined(sessionId))
		{
			sessionId =
				crypto.randomUUID();
			event.cookies.set(CART_SESSION_COOKIE, sessionId,
				{
					path: "/",
					httpOnly: true,
					secure: true,
					sameSite: "lax",
					maxAge: CART_SESSION_MAX_AGE_SECONDS
				});
		}

		event.locals.cartSessionId = sessionId;
		const response =
			await resolve(event);

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
	};

/**
 * Captures unhandled server errors and queues a sanitized payload for forwarding.
 * Stack traces and raw messages are never forwarded — OTEL handles detailed tracing.
 * Returns a generic error message to avoid leaking internal details.
 */
export const handleError: HandleServerError =
	({ error, event }) =>
	{
		const safePayload: SafeErrorPayload =
			toSafeLogPayload(error);

		queueLog(
			{
				logLevel: "Error",
				message: safePayload.message,
				exceptionMessage: `[${safePayload.code}] ${safePayload.correlationId}`,
				requestUrl: event.url.pathname,
				requestMethod: event.request.method,
				traceId: event.locals.traceId,
				spanId: event.locals.spanId
			});

		return {
			message: "An unexpected error occurred"
		};
	};