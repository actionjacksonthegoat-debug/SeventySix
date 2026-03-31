/**
 * GA4 initialization and page view tracking.
 * All analytics are consent-gated — no scripts load without explicit user consent.
 */
import { now } from "~/lib/date";
import { getConsentState } from "./consent";

declare global
{
	interface Window
	{
		/** Google Analytics gtag function. */
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		gtag: (...args: any[]) => void;

		/** Google Analytics data layer. */
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dataLayer: any[];
	}
}

/** Whether GA4 has been initialized in the current session. */
let initialized: boolean = false;

/**
 * Initializes Google Analytics 4 if consent has been granted and a measurement ID is configured.
 * Does nothing if consent is not granted or no measurement ID is provided.
 *
 * @param {string} measurementId - The GA4 measurement ID (e.g., "G-XXXXXXXXXX").
 */
export function initAnalytics(measurementId: string): void
{
	if (initialized || typeof window === "undefined")
	{
		return;
	}

	if (measurementId.length === 0)
	{
		return;
	}

	if (getConsentState() !== "granted")
	{
		return;
	}

	window.dataLayer =
		window.dataLayer ?? [];
	window.gtag =
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		function gtag(...args: any[]): void
		{
			window.dataLayer.push(args);
		};

	const script: HTMLScriptElement =
		document.createElement("script");

	script.async = true;
	script.src =
		`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
	document.head.appendChild(script);

	window.gtag("js", now());
	window.gtag("config", measurementId,
		{
			anonymize_ip: true,
			send_page_view: false
		});

	initialized = true;
}

/**
 * Sends a page_view event to GA4.
 *
 * @param {string} pagePath - The page path (e.g., "/shop/t-shirts").
 * @param {string} pageTitle - The page title.
 */
export function trackPageView(pagePath: string, pageTitle: string): void
{
	if (!initialized || typeof window === "undefined")
	{
		return;
	}

	window.gtag("event", "page_view",
		{
			page_path: pagePath,
			page_title: pageTitle
		});
}

/**
 * Resets the initialized flag (e.g., when consent is revoked).
 */
export function resetAnalytics(): void
{
	initialized = false;
}

/**
 * Checks if analytics has been initialized.
 *
 * @returns {boolean}
 * True if GA4 is active.
 */
export function isAnalyticsActive(): boolean
{
	return initialized;
}