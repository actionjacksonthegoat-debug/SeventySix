import { ApiStatisticsTableComponent } from "@admin/components/api-statistics-table/api-statistics-table.component";
import { GrafanaDashboardEmbedComponent } from "@admin/components/grafana-dashboard-embed/grafana-dashboard-embed.component";
import { ScheduledJobsTableComponent } from "@admin/components/scheduled-jobs-table/scheduled-jobs-table.component";
import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { MatTabsModule } from "@angular/material/tabs";
import { MatToolbarModule } from "@angular/material/toolbar";
import { environment } from "@environments/environment";
import { PageHeaderComponent } from "@shared/components";
import { CARD_MATERIAL_MODULES } from "@shared/material-bundles.constants";
import { LoggerService } from "@shared/services/logger.service";
import { NotificationService } from "@shared/services/notification.service";
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

	/**
	 * Opens Jaeger distributed tracing UI in a new browser tab.
	 * Opens to the search page pre-filtered for SeventySix.Api service.
	 * @remarks
	 * Pre-filtered to show traces for the SeventySix.Api service.
	 * @returns {void}
	 */
	openJaeger(): void
	{
		const jaegerUrl: string =
			environment.observability.jaegerUrl;
		// Open to search view with SeventySix.Api service pre-selected
		window.open(`${jaegerUrl}/search?service=SeventySix.Api`, "_blank");
	}

	/**
	 * Opens Prometheus metrics UI in a new browser tab.
	 * Navigates to targets view showing all scrape endpoints and their health.
	 * @remarks
	 * Provides visibility into which metric endpoints are up/down.
	 * @returns {void}
	 */
	openPrometheus(): void
	{
		const prometheusUrl: string =
			environment.observability.prometheusUrl;
		// Open to targets view to see scrape endpoint health
		window.open(`${prometheusUrl}/targets`, "_blank");
	}

	/**
	 * Opens Grafana full UI in a new browser tab.
	 * Navigates to dashboards list for quick access to all available dashboards.
	 * @remarks
	 * Shows all configured dashboards in the organization.
	 * @returns {void}
	 */
	openGrafana(): void
	{
		const grafanaUrl: string =
			environment.observability.grafanaUrl;
		// Open to dashboards list view
		window.open(`${grafanaUrl}/dashboards`, "_blank");
	}

	/**
	 * Opens pgAdmin PostgreSQL management UI in a new browser tab.
	 * Only available in development (URL is undefined in production).
	 * @remarks
	 * Provides database administration capabilities for development.
	 * @returns {void}
	 */
	openPgAdmin(): void
	{
		const pgAdminUrl: string | undefined =
			environment.observability.pgAdminUrl;

		if (isPresent(pgAdminUrl))
		{
			window.open(
				pgAdminUrl,
				"_blank");
		}
	}

	/**
	 * Opens RedisInsight Valkey cache visualization in a new browser tab.
	 * Only available in development (URL is undefined in production).
	 * @remarks
	 * Provides cache data exploration and management for Valkey.
	 * @returns {void}
	 */
	openRedisInsight(): void
	{
		const redisInsightUrl: string | undefined =
			environment.observability.redisInsightUrl;

		if (isPresent(redisInsightUrl))
		{
			window.open(
				redisInsightUrl,
				"_blank");
		}
	}

	/**
	 * Opens Scalar OpenAPI reference UI in a new browser tab.
	 * Only available in development (endpoint mapped only when IsDevelopment()).
	 * @remarks
	 * Provides interactive API documentation and request testing.
	 * @returns {void}
	 */
	openScalar(): void
	{
		const scalarUrl: string | undefined =
			environment.observability.scalarUrl;

		if (isPresent(scalarUrl))
		{
			window.open(
				scalarUrl,
				"_blank");
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
}