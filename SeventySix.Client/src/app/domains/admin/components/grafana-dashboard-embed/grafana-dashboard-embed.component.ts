import { DOCUMENT } from "@angular/common";
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
import { isNullOrUndefined } from "@shared/utilities/null-check.utility";
import { ThemeService } from "@shared/services";

/**
 * Component for embedding Grafana dashboards via iframe.
 * Handles URL sanitization, kiosk mode, and theming.
 * @remarks
 * Uses DomSanitizer to safely embed external Grafana content.
 * Theme is derived from the app's brightness automatically.
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
	 * Theme service for reactive brightness tracking.
	 * @type {ThemeService}
	 * @private
	 * @readonly
	 */
	private readonly themeService: ThemeService =
		inject(ThemeService);

	/**
	 * Injected document used to read the current hostname for Codespaces detection.
	 * @type {Document}
	 * @private
	 * @readonly
	 */
	private readonly document: Document =
		inject(DOCUMENT);

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
	 * Reactive theme derived from the app's current brightness.
	 * Automatically updates when user toggles light/dark mode.
	 * @type {Signal<string>}
	 */
	readonly resolvedTheme: Signal<string> =
		computed(
			() => this.themeService.brightness());

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

	/** Regex pattern for valid Grafana dashboard UIDs (alphanumeric, hyphens, underscores). */
	private readonly dashboardUidPattern: RegExp =
		/^[a-zA-Z0-9_-]+$/;

	/** Regex to extract the port number from a localhost URL such as `https://localhost:3443`. */
	private readonly localhostPortPattern: RegExp =
		/:(\d+)/;

	/**
	 * Regex to detect a GitHub Codespaces forwarded hostname.
	 * Matches the pattern `{codespace-name}-{port}.app.github.dev`.
	 */
	private readonly codespaceHostPattern: RegExp =
		/^(.+)-(\d+)\.app\.github\.dev$/;

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
					this.resolveGrafanaBaseUrl();
				const uid: string =
					this.dashboardUid();
				const refresh: string =
					this.refreshInterval();
				const themeValue: string =
					this.resolvedTheme();

				// Validate dashboard UID to prevent URL injection
				if (!this.dashboardUidPattern.test(uid))
				{
					return this.sanitizer.bypassSecurityTrustResourceUrl("about:blank");
				}

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

	/**
	 * Resolves the Grafana base URL, remapping `localhost` ports to their
	 * GitHub Codespaces port-forwarded equivalents when running inside a Codespace.
	 *
	 * In Codespaces, port-forwarded URLs follow the pattern
	 * `{codespace-name}-{port}.app.github.dev`. Because the browser cannot reach
	 * `localhost` inside the remote container, the configured localhost URL is
	 * rewritten to the corresponding forwarded URL at runtime.
	 *
	 * @returns {string}
	 * The resolved Grafana base URL — either the configured value or the Codespace URL.
	 */
	private resolveGrafanaBaseUrl(): string
	{
		const configuredUrl: string =
			environment.observability.grafanaUrl;
		const hostname: string =
			this.document.location.hostname;
		const codespaceMatch: RegExpMatchArray | null =
			hostname.match(this.codespaceHostPattern);

		if (isNullOrUndefined(codespaceMatch))
		{
			return configuredUrl;
		}

		const portMatch: RegExpMatchArray | null =
			configuredUrl.match(this.localhostPortPattern);

		if (isNullOrUndefined(portMatch))
		{
			return configuredUrl;
		}

		const codespaceBaseName: string =
			codespaceMatch[1];
		const grafanaPort: string =
			portMatch[1];

		return `https://${codespaceBaseName}-${grafanaPort}.app.github.dev`;
	}
}