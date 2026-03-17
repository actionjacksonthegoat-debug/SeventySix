import { ApiStatisticsTableComponent } from "@admin/components/api-statistics-table/api-statistics-table.component";
import { GrafanaDashboardEmbedComponent } from "@admin/components/grafana-dashboard-embed/grafana-dashboard-embed.component";
import { ScheduledJobsTableComponent } from "@admin/components/scheduled-jobs-table/scheduled-jobs-table.component";
import { DOCUMENT } from "@angular/common";
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from "@angular/core";
import { MatTabsModule } from "@angular/material/tabs";
import { MatToolbarModule } from "@angular/material/toolbar";
import { environment } from "@environments/environment";
import { PageHeaderComponent } from "@shared/components";
import { CARD_MATERIAL_MODULES } from "@shared/material-bundles.constants";
import { LoggerService } from "@shared/services/logger.service";
import { NotificationService } from "@shared/services/notification.service";
import { WindowService } from "@shared/services/window.service";
import { resolveCodespaceUrl } from "@shared/utilities/codespace-url.utility";
import { isPresent } from "@shared/utilities/null-check.utility";

/**
 * Admin Dashboard page.
 * Embeds Grafana dashboards for system health and API endpoint metrics.
 * Displays application-specific data (third-party API stats) not available in Grafana.
 * @remarks
 * Follows DRY principle by leveraging Grafana for metrics visualization.
 * Only displays data not available in Grafana (third-party API statistics).
 */
@Component(
	{
		selector: "app-admin-dashboard",
		imports: [
			MatToolbarModule,
			MatTabsModule,
			GrafanaDashboardEmbedComponent,
			ApiStatisticsTableComponent,
			ScheduledJobsTableComponent,
			PageHeaderComponent,
			...CARD_MATERIAL_MODULES
		],
		templateUrl: "./admin-dashboard.html",
		styleUrl: "./admin-dashboard.scss",
		changeDetection: ChangeDetectionStrategy.OnPush
	})
export class AdminDashboardPage
{
	/**
	 * Whether the application is running in production mode.
	 * Used to hide dev-only UI sections (data tools, log validations).
	 * @type {boolean}
	 * @readonly
	 */
	readonly isProduction: boolean =
		environment.production;

	/**
	 * Notification service used to display user-facing messages.
	 * @type {NotificationService}
	 * @private
	 * @readonly
	 */
	private readonly notificationService: NotificationService =
		inject(NotificationService);

	/**
	 * Logger service for diagnostic and error messages.
	 * @type {LoggerService}
	 * @private
	 * @readonly
	 */
	private readonly loggerService: LoggerService =
		inject(LoggerService);

	private readonly windowService: WindowService =
		inject(WindowService);

	/**
	 * Injected document used to read the current hostname for Codespaces URL resolution.
	 * @type {Document}
	 * @private
	 * @readonly
	 */
	private readonly document: Document =
		inject(DOCUMENT);

	// Best-effort tracking of opened observability tabs.
	// Closed on component destroy (which includes logout navigation).
	// Cross-origin windows may deny programmatic close.
	private readonly trackedWindows: Set<Window> =
		new Set();

	/**
	 * System overview dashboard UID from environment configuration.
	 * @type {string}
	 * @readonly
	 */
	readonly systemOverviewDashboard: string =
		environment.observability.dashboards.systemOverview;

	/**
	 * API endpoints dashboard UID from environment configuration.
	 * @type {string}
	 * @readonly
	 */
	readonly apiEndpointsDashboard: string =
		environment.observability.dashboards.apiEndpoints;

	/**
	 * Valkey cache dashboard UID from environment configuration.
	 * @type {string}
	 * @readonly
	 */
	readonly valkeyCacheDashboard: string =
		environment.observability.dashboards.valkeyCache;

	constructor()
	{
		inject(DestroyRef)
			.onDestroy(
				() => this.closeTrackedWindows());
	}

	/**
	 * Opens Jaeger distributed tracing UI in a new browser tab.
	 * Opens to the search page pre-filtered for SeventySix.Api service.
	 * @returns {void}
	 */
	openJaeger(): void
	{
		const jaegerUrl: string =
			resolveCodespaceUrl(
				environment.observability.jaegerUrl,
				this.document.location.hostname);
		this.openTracked(`${jaegerUrl}/search?service=SeventySix.Api`);
	}

	/**
	 * Opens Prometheus metrics UI in a new browser tab.
	 * Navigates to targets view showing all scrape endpoints and their health.
	 * @returns {void}
	 */
	openPrometheus(): void
	{
		const prometheusUrl: string =
			resolveCodespaceUrl(
				environment.observability.prometheusUrl,
				this.document.location.hostname);
		this.openTracked(`${prometheusUrl}/targets`);
	}

	/**
	 * Opens Grafana full UI in a new browser tab.
	 * Navigates to dashboards list for quick access to all available dashboards.
	 * @returns {void}
	 */
	openGrafana(): void
	{
		const grafanaUrl: string =
			resolveCodespaceUrl(
				environment.observability.grafanaUrl,
				this.document.location.hostname);
		this.openTracked(`${grafanaUrl}/dashboards`);
	}

	/**
	 * Opens pgAdmin PostgreSQL management UI in a new browser tab.
	 * Only available in development (URL is undefined in production).
	 * @returns {void}
	 */
	openPgAdmin(): void
	{
		const pgAdminUrl: string | undefined =
			resolveCodespaceUrl(
				environment.observability.pgAdminUrl,
				this.document.location.hostname);

		if (isPresent(pgAdminUrl))
		{
			this.openTracked(pgAdminUrl);
		}
	}

	/**
	 * Opens RedisInsight Valkey cache visualization in a new browser tab.
	 * Only available in development (URL is undefined in production).
	 * @returns {void}
	 */
	openRedisInsight(): void
	{
		const redisInsightUrl: string | undefined =
			resolveCodespaceUrl(
				environment.observability.redisInsightUrl,
				this.document.location.hostname);

		if (isPresent(redisInsightUrl))
		{
			this.openTracked(redisInsightUrl);
		}
	}

	/**
	 * Opens Scalar OpenAPI reference UI in a new browser tab.
	 * Only available in development (endpoint mapped only when IsDevelopment()).
	 * @returns {void}
	 */
	openScalar(): void
	{
		const scalarUrl: string | undefined =
			resolveCodespaceUrl(
				environment.observability.scalarUrl,
				this.document.location.hostname);

		if (isPresent(scalarUrl))
		{
			this.openTracked(scalarUrl);
		}
	}

	/**
	 * Sends a test Info log and shows notification.
	 * Uses forceInfo to bypass environment log level filtering.
	 * @returns {void}
	 */
	sendInfoLog(): void
	{
		this.notificationService.info("Sending Info Log");
		this.loggerService.forceInfo("Test Info Log from Admin Dashboard");
	}

	/**
	 * Sends a test Warning log and shows notification.
	 * Uses forceWarning to bypass environment log level filtering.
	 * @returns {void}
	 */
	sendWarnLog(): void
	{
		this.notificationService.warning("Sending Warn Log");
		this.loggerService.forceWarning(
			"Test Warning Log from Admin Dashboard");
	}

	/**
	 * Sends a test Error log by intentionally dividing by zero.
	 * Shows notification and throws error for error handling validation.
	 * Uses forceError to bypass environment log level filtering.
	 * @returns {void}
	 */
	sendErrorLog(): void
	{
		const zero: number = 0;
		const result: number =
			1 / zero;
		throw new Error(`Division by zero test error. Result: ${result}`);
	}

	private openTracked(url: string): void
	{
		const win: Window | null =
			this.windowService.openWindow(url, "_blank");

		if (isPresent(win))
		{
			this.trackedWindows.add(win);
		}
	}

	private closeTrackedWindows(): void
	{
		for (const win of this.trackedWindows)
		{
			try
			{
				win.close();
			}
			catch
			{
				// Cross-origin windows may deny programmatic close
			}
		}
		this.trackedWindows.clear();
	}
}