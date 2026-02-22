import { inject, Injectable } from "@angular/core";
import { environment } from "@environments/environment";
import { FeatureFlagsService } from "@shared/services/feature-flags.service";

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
	private readonly featureFlags: FeatureFlagsService =
		inject(FeatureFlagsService);

	/**
	 * The ALTCHA challenge endpoint URL.
	 * @type {string}
	 * @private
	 * @readonly
	 */
	private readonly challengeUrl: string =
		`${environment.apiUrl}/altcha/challenge`;

	/**
	 * Gets whether ALTCHA validation is enabled.
	 * Reads from server-sourced feature flags rather than environment config,
	 * allowing server-side control without client redeployment.
	 * @returns {boolean}
	 * True if ALTCHA is enabled per server feature flags.
	 */
	get enabled(): boolean
	{
		return this.featureFlags.altchaEnabled();
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