import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

const SAFE_METHODS: Set<string> =
	new Set(
		["GET", "HEAD", "OPTIONS"]);

/**
 * CSRF protection middleware using origin validation.
 * Safe methods (GET, HEAD, OPTIONS) pass without checks.
 * Mutating methods must include an Origin header matching the allowed origin.
 */
export const csrfMiddleware =
	createMiddleware()
		.server(
			async ({ next }) =>
			{
				const request: Request =
					getRequest();
				const method: string =
					request.method.toUpperCase();

				if (SAFE_METHODS.has(method))
				{
					return next();
				}

				const origin: string | null =
					request.headers.get("origin");
				const allowedOrigin: string =
					new URL(
						process.env.BASE_URL ?? "https://localhost:3002")
						.origin;

				if (origin === null || origin !== allowedOrigin)
				{
					return new Response(
						JSON.stringify(
							{ error: "CSRF validation failed" }),
						{
							status: 403,
							headers: { "Content-Type": "application/json" }
						});
				}

				return next();
			});