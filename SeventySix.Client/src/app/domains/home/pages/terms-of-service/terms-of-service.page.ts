import { ChangeDetectionStrategy, Component, computed, inject, Signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { PageHeaderComponent } from "@shared/components";
import { FeatureFlagsService } from "@shared/services";

@Component(
	{
		selector: "app-terms-of-service-page",
		imports: [PageHeaderComponent, RouterLink],
		templateUrl: "./terms-of-service.page.html",
		styleUrl: "./terms-of-service.page.scss",
		changeDetection: ChangeDetectionStrategy.OnPush
	})
/**
 * Terms of Service page — minimum viable legal terms.
 *
 * ⚠️ Have an attorney review and customise for your jurisdiction before public launch.
 */
export class TermsOfServicePage
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