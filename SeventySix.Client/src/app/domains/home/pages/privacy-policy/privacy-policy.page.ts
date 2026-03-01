import { ChangeDetectionStrategy, Component, computed, inject, Signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { PageHeaderComponent } from "@shared/components";
import { FeatureFlagsService } from "@shared/services";

@Component(
	{
		selector: "app-privacy-policy-page",
		imports: [PageHeaderComponent, RouterLink],
		templateUrl: "./privacy-policy.page.html",
		styleUrl: "./privacy-policy.page.scss",
		changeDetection: ChangeDetectionStrategy.OnPush
	})
/**
 * Privacy Policy page — GDPR Art. 13/14 + CCPA § 1798.100 compliant disclosure.
 */
export class PrivacyPolicyPage
{
	private readonly featureFlagsService: FeatureFlagsService =
		inject(FeatureFlagsService);

	/** Contact email driven by server-side SiteSettings — never hardcoded. */
	protected readonly siteEmail: Signal<string> =
		this.featureFlagsService.siteEmail;

	/** Pre-built mailto href for template binding. */
	protected readonly siteEmailHref: Signal<string> =
		computed(() => `mailto:${this.siteEmail()}`);

	/**
	 * Last-updated string displayed on the page.
	 * @type {string}
	 * @protected
	 */
	protected readonly lastUpdated: string = "February 2026";
}