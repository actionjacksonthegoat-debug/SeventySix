import {
	ChangeDetectionStrategy,
	Component,
	inject,
	output,
	OutputEmitterRef
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDividerModule } from "@angular/material/divider";
import { RouterLink } from "@angular/router";
import { slideInFromBottom } from "@shared/animations";
import { CookieConsentService } from "@shared/services/cookie-consent.service";

@Component(
	{
		selector: "app-cookie-consent-banner",
		imports: [MatButtonModule, MatDividerModule, RouterLink],
		templateUrl: "./cookie-consent-banner.component.html",
		styleUrl: "./cookie-consent-banner.component.scss",
		changeDetection: ChangeDetectionStrategy.OnPush,
		animations: [slideInFromBottom]
	})
/**
 * GDPR/CCPA cookie consent banner.
 *
 * Slides in from the bottom of the viewport on first visit.
 * Non-blocking — users can still navigate the site.
 * Equal-weight CTAs to avoid dark patterns.
 *
 * @example
 * <app-cookie-consent-banner (openPreferences)="openCookiePreferences()">
 * </app-cookie-consent-banner>
 */
export class CookieConsentBannerComponent
{
	/**
	 * Cookie consent state service.
	 * @type {CookieConsentService}
	 * @protected
	 * @readonly
	 */
	protected readonly consentService: CookieConsentService =
		inject(CookieConsentService);

	/**
	 * Emitted when the user clicks "Cookie Settings" to open the preferences dialog.
	 */
	readonly openPreferences: OutputEmitterRef<void> =
		output<void>();

	/**
	 * Accept all cookie categories.
	 * @returns {void}
	 */
	protected acceptAll(): void
	{
		this.consentService.acceptAll();
	}

	/**
	 * Reject non-essential cookies.
	 * @returns {void}
	 */
	protected rejectNonEssential(): void
	{
		this.consentService.rejectNonEssential();
	}

	/**
	 * Emit event to open the preferences dialog.
	 * @returns {void}
	 */
	protected managePreferences(): void
	{
		this.openPreferences.emit();
	}
}