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
	 * Opens Prometheus UI in a new tab
	 */
	openPrometheus(): void
	{
		const url: string =
			environment.observability.prometheusUrl || "http://localhost:9090";
		window.open(url, "_blank");
	}
}
