import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatIconModule } from "@angular/material/icon";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatTabsModule } from "@angular/material/tabs";
import { GrafanaDashboardEmbedComponent } from "./components/grafana-dashboard-embed/grafana-dashboard-embed.component";
import { ApiStatisticsTableComponent } from "./components/api-statistics-table/api-statistics-table.component";
import { environment } from "@environments/environment";

/**
 * Admin Dashboard main component.
 * Embeds Grafana dashboards for system health and API endpoint metrics.
 * Displays application-specific data (third-party API stats) not available in Grafana.
 * @remarks
 * Follows DRY principle by leveraging Grafana for metrics visualization.
 * Only displays data not available in Grafana (third-party API statistics).
 */
@Component({
	selector: "app-admin-dashboard",
	imports: [
		CommonModule,
		MatToolbarModule,
		MatIconModule,
		MatCardModule,
		MatButtonModule,
		MatTabsModule,
		GrafanaDashboardEmbedComponent,
		ApiStatisticsTableComponent
	],
	templateUrl: "./admin-dashboard.component.html",
	styleUrl: "./admin-dashboard.component.scss"
})
export class AdminDashboardComponent
{
	/**
	 * Flag indicating if observability stack is enabled.
	 * Controls visibility of Grafana dashboards and quick links.
	 */
	readonly isObservabilityEnabled: boolean =
		environment.observability.enabled;

	/**
	 * System overview dashboard UID from environment configuration.
	 */
	readonly systemOverviewDashboard: string =
		environment.observability.dashboards.systemOverview;

	/**
	 * API endpoints dashboard UID from environment configuration.
	 */
	readonly apiEndpointsDashboard: string =
		environment.observability.dashboards.apiEndpoints;

	/**
	 * Opens Jaeger distributed tracing UI in a new browser tab.
	 * Opens to the search page pre-filtered for SeventySix.Api service.
	 * @remarks
	 * Pre-filtered to show traces for the SeventySix.Api service.
	 */
	openJaeger(): void
	{
		const baseUrl: string =
			environment.observability.jaegerUrl || "http://localhost:16686";
		// Open to search view with SeventySix.Api service pre-selected
		window.open(`${baseUrl}/search?service=SeventySix.Api`, "_blank");
	}

	/**
	 * Opens Prometheus metrics UI in a new browser tab.
	 * Navigates to targets view showing all scrape endpoints and their health.
	 * @remarks
	 * Provides visibility into which metric endpoints are up/down.
	 */
	openPrometheus(): void
	{
		const baseUrl: string =
			environment.observability.prometheusUrl || "http://localhost:9090";
		// Open to targets view to see scrape endpoint health
		window.open(`${baseUrl}/targets`, "_blank");
	}

	/**
	 * Opens Grafana full UI in a new browser tab.
	 * Navigates to dashboards list for quick access to all available dashboards.
	 * @remarks
	 * Shows all configured dashboards in the organization.
	 */
	openGrafana(): void
	{
		const baseUrl: string =
			environment.observability.grafanaUrl || "http://localhost:3000";
		// Open to dashboards list view
		window.open(`${baseUrl}/dashboards`, "_blank");
	}
}
