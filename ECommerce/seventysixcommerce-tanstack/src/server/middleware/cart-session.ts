import { createMiddleware } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import {
	CART_SESSION_COOKIE,
	CART_SESSION_MAX_AGE_SECONDS
} from "~/lib/constants";

/**
 * Ensures every request has an anonymous cart session.
 * Creates a new session UUID if no cart_session cookie exists.
 * Passes cartSessionId through middleware context.
 */
export const cartSessionMiddleware =
	createMiddleware()
		.server(
			async ({ next }) =>
			{
				let sessionId: string =
					getCookie(CART_SESSION_COOKIE) ?? "";

				if (sessionId === "")
				{
					sessionId =
						crypto.randomUUID();
					setCookie(CART_SESSION_COOKIE, sessionId,
						{
							httpOnly: true,
							secure: process.env.NODE_ENV === "production",
							sameSite: "lax",
							maxAge: CART_SESSION_MAX_AGE_SECONDS,
							path: "/"
						});
				}

				return next(
					{ context: { cartSessionId: sessionId } });
			});