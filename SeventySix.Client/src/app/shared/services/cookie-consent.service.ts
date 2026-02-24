import { computed, inject, Injectable, Signal, signal, WritableSignal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { NavigationEnd, Router } from "@angular/router";
import type { CookieConsentStatus } from "@shared/models/cookie-consent-status.model";
import type { CookieConsentPreferences } from "@shared/models/cookie-consent.model";
import { DateService } from "@shared/services/date.service";
import { isNullOrUndefined } from "@shared/utilities/null-check.utility";
import { filter, map, startWith } from "rxjs/operators";

/**
 * Cookie consent field constants.
 */
const CONSENT_COOKIE_NAME: string = "seventysix_consent";
const CONSENT_VERSION: string = "1.0";
const CONSENT_EXPIRY_DAYS: number = 365;

/**
 * The route prefix under which the consent banner auto-appears.
 *
 * All `/auth/*` routes are credential-entry points (login, register, password reset, MFA).
 * They are the first pages an unauthenticated user sees before session creation.
 * Every authenticated route (`/account`, `/admin`, `/developer`) requires a valid session,
 * so the user must have already passed through `/auth/*` — and therefore already seen the banner.
 * The footer "Cookie Settings" link bypasses this using the manual trigger.
 */
const AUTH_ROUTE_PREFIX: string = "/auth";

@Injectable(
	{ providedIn: "root" })
/**
 * Manages GDPR/CCPA cookie consent state.
 *
 * Persists preferences in a secure, SameSite=Lax consent cookie.
 * All non-essential cookie/tracking initialization MUST check this service first.
 *
 * @see {@link CookieConsentPreferences}
 */
export class CookieConsentService
{
	private readonly dateService: DateService =
		inject(DateService);

	private readonly router: Router =
		inject(Router);

	private readonly _preferences: WritableSignal<CookieConsentPreferences | null> =
		signal<
		CookieConsentPreferences | null>(this.loadFromCookie());

	/**
	 * True when the user manually triggered the banner via "Cookie Settings".
	 * Overrides public-route suppression so the footer link always works.
	 */
	private readonly _manuallyShown: WritableSignal<boolean> =
		signal(false);

	/**
	 * True when the current route is under `/auth/`, meaning the user is at a
	 * credential-entry point and should see the consent banner before any session is created.
	 */
	private readonly isAuthEntryRoute: Signal<boolean> =
		toSignal(
			this.router.events.pipe(
				filter((event) =>
					event instanceof NavigationEnd),
				startWith(null),
				map(() =>
					CookieConsentService.computeIsAuthEntryRoute(this.router.url))),
			{ initialValue: CookieConsentService.computeIsAuthEntryRoute(this.router.url) });

	readonly status: Signal<CookieConsentStatus> =
		computed(
			() =>
			{
				const prefs: CookieConsentPreferences | null =
					this._preferences();

				if (isNullOrUndefined(prefs))
				{
					return "pending";
				}

				if (prefs.functional && prefs.analytics)
				{
					return "accepted";
				}

				if (!prefs.functional && !prefs.analytics)
				{
					return "rejected";
				}

				return "customized";
			});

	readonly showBanner: Signal<boolean> =
		computed(
			() =>
				(this.status() === "pending" && this.isAuthEntryRoute())
					|| this._manuallyShown());

	readonly preferences: Signal<CookieConsentPreferences | null> =
		this._preferences.asReadonly();

	readonly hasFunctional: Signal<boolean> =
		computed(() =>
			this._preferences()?.functional ?? false);

	readonly hasAnalytics: Signal<boolean> =
		computed(() =>
			this._preferences()?.analytics ?? false);

	/**
	 * Accept all cookie categories.
	 * @returns {void}
	 */
	acceptAll(): void
	{
		this.savePreferences(
			{
				strictlyNecessary: true,
				functional: true,
				analytics: true,
				consentDate: this.dateService.now(),
				version: CONSENT_VERSION
			});
	}

	/**
	 * Reject all non-essential cookie categories.
	 * @returns {void}
	 */
	rejectNonEssential(): void
	{
		this.savePreferences(
			{
				strictlyNecessary: true,
				functional: false,
				analytics: false,
				consentDate: this.dateService.now(),
				version: CONSENT_VERSION
			});
	}

	/**
	 * Save granular preferences from the preference dialog.
	 * @param {boolean} functional
	 * @param {boolean} analytics
	 * @returns {void}
	 */
	saveCustomPreferences(functional: boolean, analytics: boolean): void
	{
		this.savePreferences(
			{
				strictlyNecessary: true,
				functional,
				analytics,
				consentDate: this.dateService.now(),
				version: CONSENT_VERSION
			});
	}

	/**
	 * Re-opens the consent banner by clearing stored consent.
	 * Called from the footer "Cookie Settings" link.
	 * @returns {void}
	 */
	reopenBanner(): void
	{
		// Expire the cookie immediately
		document.cookie =
			`${CONSENT_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax; Secure`;
		this._preferences.set(null);
		this._manuallyShown.set(true);
	}

	/**
	 * Clears stored cookie consent when the current user logs out.
	 *
	 * Ensures the next person using this browser/device gets their own
	 * consent prompt rather than inheriting a previous user's choices.
	 * Per ICO guidance: always rely on the most recent user's indication.
	 *
	 * IMPORTANT: does NOT set _manuallyShown — the banner appears only when
	 * the next visitor naturally reaches a non-public route.
	 *
	 * @returns {void}
	 */
	clearConsentForNextUser(): void
	{
		document.cookie =
			`${CONSENT_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax; Secure`;
		this._preferences.set(null);
	}

	private savePreferences(preferences: CookieConsentPreferences): void
	{
		this._manuallyShown.set(false);
		this._preferences.set(preferences);
		this.persistToCookie(preferences);
	}

	private persistToCookie(preferences: CookieConsentPreferences): void
	{
		const expiryMs: number =
			this.dateService.nowTimestamp() + (CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
		const expiry: Date =
			this.dateService.fromMillis(expiryMs);

		const value: string =
			encodeURIComponent(JSON.stringify(preferences));
		document.cookie =
			`${CONSENT_COOKIE_NAME}=${value}; expires=${expiry.toUTCString()}; path=/; SameSite=Lax; Secure`;
	}

	/**
	 * Determines whether a given URL is an auth credential-entry route (`/auth/*`).
	 * The banner is shown automatically only on these routes — every authenticated
	 * route requires a session that was established through `/auth/*` first.
	 *
	 * @param url - The full URL string (may include query string / fragment).
	 * @returns {boolean} True if the URL is under the `/auth` prefix.
	 */
	private static computeIsAuthEntryRoute(url: string): boolean
	{
		const path: string =
			url
				.split("?")[0]
				.split("#")[0];

		return path === AUTH_ROUTE_PREFIX || path.startsWith(`${AUTH_ROUTE_PREFIX}/`);
	}

	private loadFromCookie(): CookieConsentPreferences | null
	{
		const cookie: string | undefined =
			document
				.cookie
				.split("; ")
				.find((row) =>
					row.startsWith(`${CONSENT_COOKIE_NAME}=`));

		if (isNullOrUndefined(cookie))
		{
			return null;
		}

		try
		{
			const value: string =
				decodeURIComponent(
					cookie
						.split("=")
						.slice(1)
						.join("="));
			const parsed: CookieConsentPreferences =
				JSON.parse(value) as CookieConsentPreferences;

			// Re-prompt if policy version changed
			if (parsed.version !== CONSENT_VERSION)
			{
				return null;
			}

			return parsed;
		}
		catch
		{
			return null;
		}
	}
}