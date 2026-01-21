import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	input,
	InputSignal,
	Signal
} from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { environment } from "@environments/environment";

/**
 * Component for embedding Grafana dashboards via iframe.
 * Handles URL sanitization, kiosk mode, and theming.
 * @remarks
 * Uses DomSanitizer to safely embed external Grafana content.
 * Follows KISS principle by using simple iframe embedding.
 */
@Component(
	{
		selector: "app-grafana-dashboard-embed",
		imports: [MatCardModule],
		templateUrl: "./grafana-dashboard-embed.component.html",
		styleUrl: "./grafana-dashboard-embed.component.scss",
		changeDetection: ChangeDetectionStrategy.OnPush
	})
export class GrafanaDashboardEmbedComponent
{
	/**
	 * DOM sanitizer used to create a SafeResourceUrl for iframe embedding.
	 * @type {DomSanitizer}
	 * @private
	 * @readonly
	 */
	private readonly sanitizer: DomSanitizer =
		inject(DomSanitizer);

	/**
	 * Dashboard UID (e.g., 'seventysix-system-overview').
	 * Required input for identifying which Grafana dashboard to embed.
	 * @type {InputSignal<string>}
	 */
	readonly dashboardUid: InputSignal<string> =
		input.required<string>();

	/**
	 * Refresh interval using Grafana syntax.
	 * Examples: '5s', '30s', '1m', '5m'
	 * @default '30s'
	 * @type {InputSignal<string>}
	 */
	readonly refreshInterval: InputSignal<string> =
		input<string>("30s");

	/**
	 * Grafana theme to apply to embedded dashboard.
	 * @default 'dark'
	 * @type {InputSignal<string>}
	 */
	readonly theme: InputSignal<string> =
		input<string>("dark");

	/**
	 * Dashboard title displayed in card header.
	 * @default 'Dashboard'
	 * @type {InputSignal<string>}
	 */
	readonly title: InputSignal<string> =
		input<string>("Dashboard");

	/**
	 * Height of iframe as CSS value.
	 * @default '600px'
	 * @type {InputSignal<string>}
	 */
	readonly height: InputSignal<string> =
		input<string>("600px");

	/**
	 * Computed safe URL for iframe src binding.
	 * Constructs Grafana URL with kiosk mode (hides UI chrome).
	 * Format: {baseUrl}/d/{uid}/{slug}?orgId=1&refresh={interval}&theme={theme}&kiosk
	 * Note: Including the slug prevents Grafana's "not correct url correcting" messages.
	 * @type {Signal<SafeResourceUrl>}
	 */
	readonly sanitizedUrl: Signal<SafeResourceUrl> =
		computed(
			() =>
			{
				const baseUrl: string =
					environment.observability.grafanaUrl;
				const uid: string =
					this.dashboardUid();
				const refresh: string =
					this.refreshInterval();
				const themeValue: string =
					this.theme();

				// Include the UID as the slug to match Grafana's expected URL format
				// This prevents "not correct url correcting" console messages
				const url: string =
					`${baseUrl}/d/${uid}/${uid}?orgId=1&refresh=${refresh}&theme=${themeValue}&kiosk`;

				return this.sanitizer.bypassSecurityTrustResourceUrl(url);
			});

	/**
	 * Computed accessible title for the iframe.
	 * Appends 'dashboard' suffix for screen reader context.
	 * @type {Signal<string>}
	 */
	readonly iframeTitle: Signal<string> =
		computed(
			() => `${this.title()} dashboard`);
}
