import {
	Component,
	ChangeDetectionStrategy,
	input,
	InputSignal,
	computed,
	Signal,
	inject
} from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { environment } from "@environments/environment";

/**
 * Component for embedding Grafana dashboards via iframe.
 * Handles URL sanitization, kiosk mode, and theming.
 * @remarks
 * Uses DomSanitizer to safely embed external Grafana content.
 * Follows KISS principle by using simple iframe embedding.
 */
@Component({
	selector: "app-grafana-dashboard-embed",
	imports: [CommonModule, MatCardModule, MatProgressSpinnerModule],
	templateUrl: "./grafana-dashboard-embed.component.html",
	styleUrl: "./grafana-dashboard-embed.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class GrafanaDashboardEmbedComponent
{
	private readonly sanitizer: DomSanitizer = inject(DomSanitizer);

	/**
	 * Dashboard UID (e.g., 'seventysix-system-overview').
	 * Required input for identifying which Grafana dashboard to embed.
	 */
	readonly dashboardUid: InputSignal<string> = input.required<string>();

	/**
	 * Refresh interval using Grafana syntax.
	 * Examples: '5s', '30s', '1m', '5m'
	 * @default '5s'
	 */
	readonly refreshInterval: InputSignal<string> = input<string>("5s");

	/**
	 * Grafana theme to apply to embedded dashboard.
	 * @default 'dark'
	 */
	readonly theme: InputSignal<string> = input<string>("dark");

	/**
	 * Dashboard title displayed in card header.
	 * @default 'Dashboard'
	 */
	readonly title: InputSignal<string> = input<string>("Dashboard");

	/**
	 * Height of iframe as CSS value.
	 * @default '600px'
	 */
	readonly height: InputSignal<string> = input<string>("600px");

	/**
	 * Computed safe URL for iframe src binding.
	 * Constructs Grafana URL with kiosk mode (hides UI chrome).
	 * Format: {baseUrl}/d/{uid}?orgId=1&refresh={interval}&theme={theme}&kiosk
	 * @returns Sanitized resource URL safe for iframe embedding
	 */
	readonly sanitizedUrl: Signal<SafeResourceUrl> = computed(() =>
	{
		const baseUrl: string = environment.observability.grafanaUrl;
		const uid: string = this.dashboardUid();
		const refresh: string = this.refreshInterval();
		const themeValue: string = this.theme();

		const url: string = `${baseUrl}/d/${uid}?orgId=1&refresh=${refresh}&theme=${themeValue}&kiosk`;

		return this.sanitizer.bypassSecurityTrustResourceUrl(url);
	});

	/**
	 * Loading state for showing spinner while iframe loads.
	 * Currently always false; can be extended for actual load detection.
	 */
	readonly isLoading: Signal<boolean> = computed(() => false);
}
