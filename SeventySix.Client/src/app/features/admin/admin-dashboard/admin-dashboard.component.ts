import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatIconModule } from "@angular/material/icon";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { ErrorTrendChartComponent } from "./components/error-trend-chart/error-trend-chart.component";
import { StatisticsCardsComponent } from "./components/statistics-cards/statistics-cards.component";
import { ApiStatisticsTableComponent } from "./components/api-statistics-table/api-statistics-table.component";
import { HealthStatusPanelComponent } from "./components/health-status-panel/health-status-panel.component";
import { environment } from "@environments/environment";

/**
 * Admin Dashboard main component
 * Composes all admin sub-components into a unified dashboard view
 */
@Component({
	selector: "app-admin-dashboard",
	standalone: true,
	imports: [
		CommonModule,
		MatToolbarModule,
		MatIconModule,
		MatCardModule,
		MatButtonModule,
		ErrorTrendChartComponent,
		StatisticsCardsComponent,
		ApiStatisticsTableComponent,
		HealthStatusPanelComponent
	],
	templateUrl: "./admin-dashboard.component.html",
	styleUrl: "./admin-dashboard.component.scss"
})
export class AdminDashboardComponent
{
	// Observability integration
	readonly isObservabilityEnabled: boolean =
		environment.observability.enabled;

	/**
	 * Opens Jaeger UI in a new tab
	 */
	openJaeger(): void
	{
		const url: string =
			environment.observability.jaegerUrl || "http://localhost:16686";
		window.open(url, "_blank");
	}

	/**
	 * Opens Prometheus UI in a new tab with SeventySix metrics dashboard
	 */
	openPrometheus(): void
	{
		const baseUrl: string =
			environment.observability.prometheusUrl || "http://localhost:9090";

		// Open to graph view with multiple useful queries
		// g0: HTTP request rate, g1: Request duration, g2: Active requests, g3: Error rate
		const queries: string[] = [
			'rate(http_server_request_duration_seconds_count{job="seventysix-api"}[5m])',
			'histogram_quantile(0.95, rate(http_server_request_duration_seconds_bucket{job="seventysix-api"}[5m]))',
			'http_server_active_requests{job="seventysix-api"}',
			'rate(http_server_request_duration_seconds_count{job="seventysix-api",http_response_status_code=~"5.."}[5m])'
		];

		// Build URL with multiple graph panels
		const queryParams: string = queries
			.map(
				(query, index) =>
					`g${index}.expr=${encodeURIComponent(query)}&g${index}.tab=0&g${index}.range_input=1h`
			)
			.join("&");

		const url: string = `${baseUrl}/graph?${queryParams}`;

		window.open(url, "_blank");
	}

	/**
	 * Opens Grafana UI in a new tab with SeventySix API Endpoints dashboard
	 * Opens in dark mode with pre-configured dashboard
	 */
	openGrafana(): void
	{
		const baseUrl: string =
			environment.observability.grafanaUrl || "http://localhost:3000";

		// Open directly to dashboard with dark theme forced
		const dashboardUrl: string = `${baseUrl}/d/seventysix-api-endpoints/seventysix-api-endpoints?orgId=1&refresh=30s&theme=dark`;

		window.open(dashboardUrl, "_blank");
	}

	/**
	 * Opens Grafana System Overview dashboard in a new tab
	 * Comprehensive metrics dashboard with health status, performance, and resource monitoring
	 */
	openGrafanaSystemOverview(): void
	{
		const baseUrl: string =
			environment.observability.grafanaUrl || "http://localhost:3000";

		const dashboardUrl: string = `${baseUrl}/d/seventysix-system-overview/seventysix-system-overview?orgId=1&refresh=5s&theme=dark`;

		window.open(dashboardUrl, "_blank");
	}
}
