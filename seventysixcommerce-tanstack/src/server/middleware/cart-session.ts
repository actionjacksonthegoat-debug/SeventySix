import { createMiddleware } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import {
	CART_COOKIE_NAME,
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
					getCookie(CART_COOKIE_NAME) ?? "";

				if (sessionId === "")
				{
					sessionId =
						crypto.randomUUID();
					setCookie(CART_COOKIE_NAME, sessionId,
						{
							httpOnly: true,
							secure: true,
							sameSite: "lax",
							maxAge: CART_SESSION_MAX_AGE_SECONDS,
							path: "/"
						});
				}

				return next(
					{ context: { cartSessionId: sessionId } });
			});