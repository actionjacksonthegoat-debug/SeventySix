import {
	Component,
	input,
	computed,
	effect,
	inject,
	InputSignal,
	Signal
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { ChartConfiguration } from "chart.js";
import { ChartComponent } from "@shared/components/chart/chart.component";
import { LogChartService } from "@admin/admin-dashboard/services";
import { LogChartData } from "@admin/admin-dashboard/models";

/**
 * Component for displaying error trend charts with time-series data
 */
@Component({
	selector: "app-error-trend-chart",
	imports: [
		CommonModule,
		MatProgressSpinnerModule,
		MatButtonModule,
		MatIconModule,
		ChartComponent
	],
	templateUrl: "./error-trend-chart.component.html",
	styleUrl: "./error-trend-chart.component.scss"
})
export class ErrorTrendChartComponent
{
	private readonly logChartService = inject(LogChartService);

	/**
	 * Time period for chart data (24h, 7d, 30d)
	 */
	readonly period: InputSignal<"24h" | "7d" | "30d"> = input<
		"24h" | "7d" | "30d"
	>("24h");

	/**
	 * Chart title
	 */
	readonly title: Signal<string> = computed(() => "Error Trends");

	/**
	 * Chart subtitle based on period
	 */
	readonly subtitle: Signal<string> = computed(() =>
	{
		const periodMap: { [key: string]: string } = {
			"24h": "Last 24 Hours",
			"7d": "Last 7 Days",
			"30d": "Last 30 Days"
		};
		return periodMap[this.period()];
	});

	/**
	 * Chart data query - initialized in field
	 */
	readonly chartDataQuery = this.logChartService.createChartDataQuery(
		this.period
	);

	/**
	 * Loading state from query
	 */
	readonly isLoading: Signal<boolean> = computed(() =>
		this.chartDataQuery.isLoading()
	);

	/**
	 * Error state from query
	 */
	readonly error: Signal<string | null> = computed(() =>
	{
		const err = this.chartDataQuery.error();
		return err ? err.message || "Failed to load chart data" : null;
	});

	/**
	 * Raw chart data from query
	 */
	private readonly rawData: Signal<LogChartData | null> = computed(
		() => this.chartDataQuery.data() ?? null
	);

	/**
	 * Transformed chart data for Chart.js
	 */
	readonly chartData: Signal<ChartConfiguration["data"] | null> = computed<
		ChartConfiguration["data"] | null
	>(() =>
	{
		const data: LogChartData | null = this.rawData();
		if (!data) return null;

		return {
			labels: data.dataPoints.map((dp) =>
				this.formatTimestamp(dp.timestamp)
			),
			datasets: [
				{
					label: "Errors",
					data: data.dataPoints.map((dp) => dp.errorCount),
					borderColor: "rgb(244, 67, 54)", // Material red
					backgroundColor: "rgba(244, 67, 54, 0.1)",
					tension: 0.4,
					fill: true
				},
				{
					label: "Warnings",
					data: data.dataPoints.map((dp) => dp.warningCount),
					borderColor: "rgb(255, 152, 0)", // Material orange
					backgroundColor: "rgba(255, 152, 0, 0.1)",
					tension: 0.4,
					fill: true
				},
				{
					label: "Fatals",
					data: data.dataPoints.map((dp) => dp.fatalCount),
					borderColor: "rgb(156, 39, 176)", // Material purple
					backgroundColor: "rgba(156, 39, 176, 0.1)",
					tension: 0.4,
					fill: true
				}
			]
		};
	});

	/**
	 * Chart options configuration
	 */
	chartOptions: ChartConfiguration["options"] = {
		responsive: true,
		maintainAspectRatio: true,
		plugins: {
			legend: {
				display: true,
				position: "top"
			},
			tooltip: {
				mode: "index",
				intersect: false
			}
		},
		scales: {
			y: {
				beginAtZero: true,
				ticks: {
					precision: 0
				}
			}
		}
	};

	constructor()
	{
		// Trigger refetch when period changes
		effect(() =>
		{
			const query = this.chartDataQuery;
			if (query)
			{
				query.refetch();
			}
		});
	}

	/**
	 * Format timestamp based on period
	 */
	private formatTimestamp(timestamp: string): string
	{
		const date: Date = new Date(timestamp);
		const period: "24h" | "7d" | "30d" = this.period();

		if (period === "24h")
		{
			// Show time for hourly data
			return date.toLocaleTimeString("en-US", {
				hour: "2-digit",
				minute: "2-digit"
			});
		}
		else if (period === "7d")
		{
			// Show day and time for weekly data
			return date.toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				hour: "2-digit"
			});
		}
		else
		{
			// Show date for monthly data
			return date.toLocaleDateString("en-US", {
				month: "short",
				day: "numeric"
			});
		}
	}

	/**
	 * Handle refresh button click
	 */
	onRefresh(): void
	{
		this.chartDataQuery.refetch();
	}
}
