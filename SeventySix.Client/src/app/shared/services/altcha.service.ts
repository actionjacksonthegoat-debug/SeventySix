import { Injectable } from "@angular/core";
import { environment } from "@environments/environment";

/**
 * Provides ALTCHA challenge endpoint access and enabled state for bot protection.
 * Used by auth pages to determine whether to show the ALTCHA widget.
 */
@Injectable(
	{
		providedIn: "root"
	})
export class AltchaService
{
	/**
	 * The ALTCHA challenge endpoint URL.
	 * @type {string}
	 * @private
	 * @readonly
	 */
	private readonly challengeUrl: string =
		`${environment.apiUrl}/altcha/challenge`;

	/**
	 * Whether ALTCHA is enabled in current environment.
	 * @type {boolean}
	 * @private
	 * @readonly
	 */
	private readonly isEnabled: boolean =
		environment.altcha.enabled;

	/**
	 * Gets whether ALTCHA validation is enabled.
	 * @returns {boolean}
	 * True if ALTCHA is enabled in environment configuration.
	 */
	get enabled(): boolean
	{
		return this.isEnabled;
	}

	/**
	 * Gets the ALTCHA challenge endpoint URL.
	 * The widget uses this to fetch proof-of-work challenges.
	 * @returns {string}
	 * The challenge endpoint URL.
	 */
	get challengeEndpoint(): string
	{
		return this.challengeUrl;
	}
}
