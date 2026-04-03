import type { JSX } from "react";
import { useEffect, useState } from "react";
import {
	type ConsentState,
	getConsentState,
	initAnalytics,
	resetAnalytics,
	revokeConsent,
	setConsentState
} from "~/lib/analytics";

/** Props for the CookieConsent component. */
interface CookieConsentProps
{
	/** GA4 measurement ID (e.g., "G-XXXXXXXXXX"). */
	readonly measurementId: string;
}

/** Cookie consent banner that gates GA4 analytics initialization. */
export function CookieConsent({ measurementId }: CookieConsentProps): JSX.Element | null
{
	const [visible, setVisible] =
		useState<boolean>(false);

	useEffect(
		() =>
		{
			const state: ConsentState =
				getConsentState();

			if (state === "pending")
			{
				setVisible(true);
			}
			else if (state === "granted")
			{
				initAnalytics(measurementId);
			}
		},
		[measurementId]);

	/** Handles the user accepting analytics tracking. */
	function handleAccept(): void
	{
		setConsentState("granted");
		initAnalytics(measurementId);
		setVisible(false);
	}

	/** Handles the user declining analytics tracking. */
	function handleDecline(): void
	{
		revokeConsent();
		resetAnalytics();
		setVisible(false);
	}

	if (!visible)
	{
		return null;
	}

	return (
		<div
			role="dialog"
			aria-label="Cookie consent"
			className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-bg-secondary p-4 shadow-lg"
		>
			<div className="mx-auto flex max-w-7xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
				<p className="text-sm text-text-secondary">
					We use cookies for analytics to improve your experience. See our{" "}
					<a href="/policies/privacy" className="underline hover:text-text-primary">Privacy Policy</a>.
				</p>
				<div className="flex gap-3">
					<button
						type="button"
						onClick={handleDecline}
						className="rounded-md border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary"
					>
						Decline
					</button>
					<button
						type="button"
						onClick={handleAccept}
						className="rounded-md bg-accent px-4 py-2 text-sm text-white transition-colors hover:bg-accent/90"
					>
						Accept
					</button>
				</div>
			</div>
		</div>);
}