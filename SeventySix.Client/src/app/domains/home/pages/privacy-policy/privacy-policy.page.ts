import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { RouterLink } from "@angular/router";
import { PageHeaderComponent } from "@shared/components";
import { CookieConsentService } from "@shared/services/cookie-consent.service";

@Component(
	{
		selector: "app-privacy-policy-page",
		imports: [PageHeaderComponent, RouterLink, MatButtonModule],
		templateUrl: "./privacy-policy.page.html",
		styleUrl: "./privacy-policy.page.scss",
		changeDetection: ChangeDetectionStrategy.OnPush
	})
/**
 * Privacy Policy page — GDPR Art. 13/14 + CCPA § 1798.100 compliant disclosure.
 */
export class PrivacyPolicyPage
{
	private readonly consentService: CookieConsentService =
		inject(CookieConsentService);

	/**
	 * Last-updated string displayed on the page.
	 * @type {string}
	 * @protected
	 */
	protected readonly lastUpdated: string = "February 2026";

	/**
	 * Re-opens the cookie consent banner so the user can update preferences.
	 * @returns {void}
	 */
	protected openCookieSettings(): void
	{
		this.consentService.reopenBanner();
	}
}