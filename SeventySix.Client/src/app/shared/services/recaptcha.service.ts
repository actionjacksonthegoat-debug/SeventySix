import { DOCUMENT } from "@angular/common";
import { inject, Injectable } from "@angular/core";
import { environment } from "@environments/environment";

/**
 * Google reCAPTCHA v3 global interface.
 */
declare const grecaptcha: {
	ready: (callback: () => void) => void;
	execute: (siteKey: string, options: { action: string; }) => Promise<string>;
};

/**
 * Provides reCAPTCHA v3 token generation for authentication forms.
 * Loads Google's reCAPTCHA script on-demand and executes invisible challenges.
 *
 * Why NOT ng-recaptcha?
 * - Last updated Nov 2023 (2+ years stale)
 * - Only supports up to Angular 17 (incompatible with Angular 21)
 * - No maintenance activity
 * - Custom service is ~50 lines with full control
 */
@Injectable(
	{
		providedIn: "root"
	})
export class RecaptchaService
{
	/**
	 * Document reference for script injection.
	 * @type {Document}
	 * @private
	 * @readonly
	 */
	private readonly document: Document =
		inject(DOCUMENT);

	/**
	 * reCAPTCHA site key from environment configuration.
	 * @type {string}
	 * @private
	 * @readonly
	 */
	private readonly siteKey: string =
		environment.recaptcha.siteKey;

	/**
	 * Whether reCAPTCHA is enabled in current environment.
	 * @type {boolean}
	 * @private
	 * @readonly
	 */
	private readonly isEnabled: boolean =
		environment.recaptcha.enabled;

	/**
	 * Tracks whether the Google reCAPTCHA script has been loaded.
	 * @type {boolean}
	 * @private
	 */
	private scriptLoaded: boolean = false;

	/**
	 * Gets whether reCAPTCHA validation is enabled.
	 * @returns {boolean}
	 * True if reCAPTCHA is enabled in environment configuration.
	 */
	get enabled(): boolean
	{
		return this.isEnabled;
	}

	/**
	 * Executes reCAPTCHA v3 challenge for the given action.
	 * @param {string} action
	 * The action name (e.g., "login", "register").
	 * @returns {Promise<string | null>}
	 * Promise resolving to the reCAPTCHA token, or null if disabled.
	 */
	async executeAsync(action: string): Promise<string | null>
	{
		if (!this.isEnabled)
		{
			return null;
		}

		await this.ensureScriptLoadedAsync();

		return new Promise(
			(resolve, reject) =>
			{
				grecaptcha.ready(
					() =>
					{
						grecaptcha
						.execute(
							this.siteKey,
							{ action })
						.then(resolve)
						.catch(reject);
					});
			});
	}

	/**
	 * Ensures the Google reCAPTCHA script is loaded exactly once.
	 * @returns {Promise<void>}
	 * Promise that resolves when script is ready.
	 * @private
	 */
	private async ensureScriptLoadedAsync(): Promise<void>
	{
		if (this.scriptLoaded)
		{
			return;
		}

		const scriptElement: HTMLScriptElement =
			this.document.createElement("script");
		scriptElement.src =
			`https://www.google.com/recaptcha/api.js?render=${this.siteKey}`;
		scriptElement.async = true;

		await new Promise<void>(
			(resolve, reject) =>
			{
				scriptElement.onload =
					(): void => resolve();
				scriptElement.onerror =
					(): void =>
						reject(new Error("Failed to load reCAPTCHA script"));
				this.document.head.appendChild(scriptElement);
			});

		this.scriptLoaded = true;
	}
}
