import { computed, inject, Injectable, Signal, signal, WritableSignal } from "@angular/core";
import type { CookieConsentStatus } from "@shared/models/cookie-consent-status.model";
import type { CookieConsentPreferences } from "@shared/models/cookie-consent.model";
import { DateService } from "@shared/services/date.service";
import { isNullOrUndefined } from "@shared/utilities/null-check.utility";

/**
 * Cookie consent field constants.
 */
const CONSENT_COOKIE_NAME: string = "seventysix_consent";
const CONSENT_VERSION: string = "1.0";
const CONSENT_EXPIRY_DAYS: number = 365;

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

	private readonly _preferences: WritableSignal<CookieConsentPreferences | null> =
		signal<
		CookieConsentPreferences | null>(this.loadFromCookie());

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
		computed(() => this.status() === "pending");

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
			`${CONSENT_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
		this._preferences.set(null);
	}

	private savePreferences(preferences: CookieConsentPreferences): void
	{
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
			`${CONSENT_COOKIE_NAME}=${value}; expires=${expiry.toUTCString()}; path=/; SameSite=Lax`;
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