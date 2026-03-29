import { env } from "$env/dynamic/private";
import { CART_SESSION_COOKIE, CART_SESSION_MAX_AGE_SECONDS } from "$lib/constants";
import { configureLogForwarder, queueLog } from "$lib/server/log-forwarder";
import { initTelemetry } from "$lib/server/telemetry";
import type { Handle, HandleServerError } from "@sveltejs/kit";

// Configure log forwarding on module load
configureLogForwarder(env.SEVENTYSIX_API_URL ?? "");

// Initialize OpenTelemetry if endpoint is configured
initTelemetry(env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "");

/**
 * Server hooks — runs on every request.
 * Manages anonymous cart session via HTTP-only cookie.
 * SvelteKit provides built-in CSRF protection for form actions.
 */
export const handle: Handle =
	async ({ event, resolve }) =>
	{
		let sessionId: string | undefined =
			event.cookies.get(CART_SESSION_COOKIE);

		if (sessionId === undefined)
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
			"Content-Security-Policy",
			"default-src 'self'; script-src 'self' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");

		return response;
	};

/**
 * Captures unhandled server errors and queues them for forwarding to the SeventySix API.
 * Returns a generic error message to avoid leaking internal details.
 */
export const handleError: HandleServerError =
	({ error, event }) =>
	{
		queueLog(
			{
				logLevel: "Error",
				message: error instanceof Error ? error.message : String(error),
				exceptionMessage: error instanceof Error ? error.message : undefined,
				stackTrace: error instanceof Error ? error.stack : undefined,
				requestUrl: event.url.pathname,
				requestMethod: event.request.method
			});

		return {
			message: "An unexpected error occurred"
		};
	};