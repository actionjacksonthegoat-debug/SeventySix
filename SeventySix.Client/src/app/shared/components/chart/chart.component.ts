import { Component, input, output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { MatTooltipModule } from "@angular/material/tooltip";
import { BaseChartDirective } from "ng2-charts";
import {
	Chart,
	ChartConfiguration,
	ChartType,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	ArcElement,
	Title,
	Tooltip,
	Legend,
	Filler,
	LineController,
	BarController,
	PieController,
	DoughnutController
} from "chart.js";

// Register Chart.js components and controllers
Chart.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	ArcElement,
	Title,
	Tooltip,
	Legend,
	Filler,
	LineController,
	BarController,
	PieController,
	DoughnutController
);

@Component({
	selector: "app-chart",
	imports: [
		CommonModule,
		MatCardModule,
		MatButtonModule,
		MatIconModule,
		MatMenuModule,
		MatTooltipModule,
		BaseChartDirective
	],
	templateUrl: "./chart.component.html",
	styleUrl: "./chart.component.scss"
})
export class ChartComponent
{
	/**
	 * Chart title displayed in mat-card header
	 */
	title = input<string>("Chart");

	/**
	 * Chart subtitle displayed in mat-card header
	 */
	subtitle = input<string | undefined>(undefined);

	/**
	 * Chart type (line, bar, pie, doughnut, etc.)
	 */
	chartType = input<ChartType>("line");

	/**
	 * Chart data configuration
	 */
	chartData = input.required<ChartConfiguration["data"]>();

	/**
	 * Chart options configuration
	 */
	chartOptions = input<ChartConfiguration["options"]>({
		responsive: true,
		maintainAspectRatio: true,
		plugins: {
			legend: {
				display: true,
				position: "top"
			}
		}
	});

	/**
	 * Whether to show the export menu
	 */
	showExport = input<boolean>(true);

	/**
	 * Whether to show the refresh button
	 */
	showRefresh = input<boolean>(true);

	/**
	 * Event emitted when user clicks refresh
	 */
	refresh = output<void>();

	/**
	 * Event emitted when user exports chart as PNG
	 */
	exportPng = output<void>();

	/**
	 * Event emitted when user exports chart data as CSV
	 */
	exportCsv = output<void>();

	/**
	 * Handle refresh button click
	 */
	onRefresh(): void
	{
		this.refresh.emit();
	}

	/**
	 * Handle export as PNG
	 */
	onExportPng(): void
	{
		this.exportPng.emit();
	}

	/**
	 * Handle export as CSV
	 */
	onExportCsv(): void
	{
		this.exportCsv.emit();
	}
}
