import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatToolbarModule } from "@angular/material/toolbar";
import { RouterLink } from "@angular/router";
import { environment } from "@environments/environment";
import { DateService } from "@shared/services";

@Component(
	{
		selector: "app-footer",
		imports: [MatToolbarModule, MatIconModule, RouterLink],
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
}