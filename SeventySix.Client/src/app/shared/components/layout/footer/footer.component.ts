import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatToolbarModule } from "@angular/material/toolbar";
import { RouterLink } from "@angular/router";
import { environment } from "@environments/environment";
import { DateService } from "@shared/services";
import { CookieConsentService } from "@shared/services/cookie-consent.service";

@Component(
	{
		selector: "app-footer",
		imports: [MatToolbarModule, MatIconModule, MatButtonModule, RouterLink],
		templateUrl: "./footer.component.html",
		styleUrl: "./footer.component.scss",
		changeDetection: ChangeDetectionStrategy.OnPush
	})
/**
 * Application footer component.
 *
 * Shows copyright year and application version.
 *
 * @remarks
 * Uses `DateService` to compute the current year and reads `environment.version`.
 */
export class FooterComponent
{
	/**
	 * Cookie consent service for reopening the banner.
	 * @type {CookieConsentService}
	 * @private
	 * @readonly
	 */
	private readonly consentService: CookieConsentService =
		inject(CookieConsentService);

	/**
	 * Date service for generating the current year timestamp.
	 * @type {DateService}
	 * @private
	 * @readonly
	 */
	private readonly dateService: DateService =
		inject(DateService);

	/**
	 * Current year for copyright display.
	 * @type {number}
	 * @protected
	 */
	protected readonly currentYear: number =
		this
			.dateService
			.parseUTC(this.dateService.now())
			.getFullYear();

	/**
	 * Application version string from build environment.
	 * @type {string}
	 * @protected
	 */
	protected readonly version: string =
		environment.version;

	/**
	 * Reopen the cookie consent banner so the user can update their preferences.
	 * @returns {void}
	 */
	protected openCookieSettings(): void
	{
		this.consentService.reopenBanner();
	}
}