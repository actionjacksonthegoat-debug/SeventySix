/**
 * Analytics consent cookie name.
 * Stores the user's preference for analytics tracking.
 */
import { isNullOrUndefined } from "../utils/null-check";

export const CONSENT_COOKIE_NAME: string = "analytics_consent";

/** Maximum age for the consent cookie in seconds (1 year). */
export const CONSENT_COOKIE_MAX_AGE: number =
	365 * 24 * 60 * 60;

/**
 * Possible consent states.
 * - `granted` — User accepted analytics tracking.
 * - `denied` — User declined analytics tracking.
 * - `pending` — User has not yet made a choice (show banner).
 */
export type ConsentState = "granted" | "denied" | "pending";

/**
 * Reads the current analytics consent state from the cookie.
 *
 * @returns {ConsentState}
 * The current consent state — `granted`, `denied`, or `pending`.
 */
export function getConsentState(): ConsentState
{
	if (typeof document === "undefined")
	{
		return "pending";
	}

	const match: RegExpMatchArray | null =
		document.cookie.match(
			new RegExp(`(?:^|;\\s*)${CONSENT_COOKIE_NAME}=([^;]*)`));

	if (isNullOrUndefined(match))
	{
		return "pending";
	}

	const value: string =
		decodeURIComponent(match[1]);

	if (value === "granted" || value === "denied")
	{
		return value;
	}

	return "pending";
}

/**
 * Sets the analytics consent cookie.
 *
 * @param {ConsentState} state - The consent state to persist.
 */
export function setConsentState(state: ConsentState): void
{
	if (typeof document === "undefined")
	{
		return;
	}

	document.cookie =
		`${CONSENT_COOKIE_NAME}=${
			encodeURIComponent(state)
		};path=/;max-age=${CONSENT_COOKIE_MAX_AGE};SameSite=Lax;Secure`;
}

/**
 * Removes the analytics consent cookie and all GA4 cookies.
 */
export function revokeConsent(): void
{
	setConsentState("denied");
	removeGaCookies();
}

/**
 * Removes Google Analytics cookies (_ga, _ga_*).
 */
function removeGaCookies(): void
{
	if (typeof document === "undefined")
	{
		return;
	}

	const cookies: string[] =
		document.cookie.split(";");

	for (const cookie of cookies)
	{
		const name: string =
			cookie.split("=")[0].trim();

		if (name === "_ga" || name.startsWith("_ga_"))
		{
			document.cookie =
				`${name}=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
		}
	}
}