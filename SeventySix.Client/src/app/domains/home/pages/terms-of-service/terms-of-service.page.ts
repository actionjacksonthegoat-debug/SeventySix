import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { PageHeaderComponent } from "@shared/components";

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
	/**
	 * Last-updated string displayed on the page.
	 * @type {string}
	 * @protected
	 */
	protected readonly lastUpdated: string = "February 2026";
}