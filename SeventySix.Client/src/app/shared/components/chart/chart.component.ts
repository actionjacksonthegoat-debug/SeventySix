import {
	Component,
	input,
	InputSignal,
	output,
	OutputEmitterRef,
	Signal,
	viewChild
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { MatTooltipModule } from "@angular/material/tooltip";
import { BaseChartDirective } from "ng2-charts";
import { SiteLayoutChangedDirective } from "@shared/directives";
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
		BaseChartDirective,
		SiteLayoutChangedDirective
	],
	templateUrl: "./chart.component.html",
	styleUrl: "./chart.component.scss"
})
export class ChartComponent
{
	/**
	 * Reference to the BaseChartDirective for programmatic chart updates
	 */
	chart: Signal<BaseChartDirective | undefined> =
		viewChild(BaseChartDirective);

	/**
	 * Chart title displayed in mat-card header
	 */
	readonly title: InputSignal<string> = input<string>("Chart");

	/**
	 * Chart subtitle displayed in mat-card header
	 */
	readonly subtitle: InputSignal<string | undefined> = input<
		string | undefined
	>(undefined);

	/**
	 * Chart type (line, bar, pie, doughnut, etc.)
	 */
	readonly chartType: InputSignal<ChartType> = input<ChartType>("line");

	/**
	 * Chart data configuration
	 */
	readonly chartData: InputSignal<ChartConfiguration["data"]> =
		input.required<ChartConfiguration["data"]>();

	/**
	 * Chart options configuration
	 */
	readonly chartOptions: InputSignal<ChartConfiguration["options"]> = input<
		ChartConfiguration["options"]
	>({
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
	readonly showExport: InputSignal<boolean> = input<boolean>(true);

	/**
	 * Whether to show the refresh button
	 */
	readonly showRefresh: InputSignal<boolean> = input<boolean>(true);

	/**
	 * Event emitted when user clicks refresh
	 */
	readonly refresh: OutputEmitterRef<void> = output<void>();

	/**
	 * Event emitted when user exports chart as PNG
	 */
	readonly exportPng: OutputEmitterRef<void> = output<void>();

	/**
	 * Event emitted when user exports chart data as CSV
	 */
	readonly exportCsv: OutputEmitterRef<void> = output<void>();

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

	/**
	 * Handle layout change (triggered by SiteLayoutChangedDirective)
	 * Redraws the chart to fit the new container width
	 */
	onLayoutChanged(): void
	{
		const chartInstance: BaseChartDirective | undefined = this.chart();
		if (chartInstance?.chart)
		{
			// Force chart to resize and redraw
			chartInstance.chart.resize();
			chartInstance.chart.update();
		}
	}
}
