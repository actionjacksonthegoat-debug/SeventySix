import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatIconModule } from "@angular/material/icon";
import { ErrorTrendChartComponent } from "./components/error-trend-chart/error-trend-chart.component";
import { StatisticsCardsComponent } from "./components/statistics-cards/statistics-cards.component";
import { ApiStatisticsTableComponent } from "./components/api-statistics-table/api-statistics-table.component";
import { HealthStatusPanelComponent } from "./components/health-status-panel/health-status-panel.component";

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
	// Component simply composes sub-components - no logic needed
}
