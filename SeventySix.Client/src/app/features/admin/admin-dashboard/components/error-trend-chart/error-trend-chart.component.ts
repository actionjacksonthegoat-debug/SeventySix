import {
	Component,
	OnInit,
	OnDestroy,
	input,
	computed,
	signal,
	effect
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { ChartConfiguration } from "chart.js";
import { ChartComponent } from "@shared/components/chart/chart.component";
import { LogChartService } from "@admin/admin-dashboard/services";
import { LogChartData } from "@admin/admin-dashboard/models";
import { Subscription } from "rxjs";

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
export class ErrorTrendChartComponent implements OnInit, OnDestroy
{
	/**
	 * Subscription for HTTP requests
	 */
	private subscription?: Subscription;
	/**
	 * Time period for chart data (24h, 7d, 30d)
	 */
	period = input<"24h" | "7d" | "30d">("24h");

	/**
	 * Chart title
	 */
	title = computed(() => "Error Trends");

	/**
	 * Chart subtitle based on period
	 */
	subtitle = computed(() =>
	{
		const periodMap = {
			"24h": "Last 24 Hours",
			"7d": "Last 7 Days",
			"30d": "Last 30 Days"
		};
		return periodMap[this.period()];
	});

	/**
	 * Loading state signal
	 */
	isLoading = signal<boolean>(true);

	/**
	 * Error state signal
	 */
	error = signal<string | null>(null);

	/**
	 * Raw chart data from API
	 */
	private rawData = signal<LogChartData | null>(null);

	/**
	 * Transformed chart data for Chart.js
	 */
	chartData = computed<ChartConfiguration["data"] | null>(() =>
	{
		const data = this.rawData();
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

	constructor(private readonly logChartService: LogChartService)
	{
		// Reload data when period changes
		effect(() =>
		{
			const currentPeriod = this.period();
			this.loadChartData(currentPeriod);
		});
	}

	ngOnInit(): void
	{
		// Initial load is handled by effect
	}

	ngOnDestroy(): void
	{
		this.subscription?.unsubscribe();
	}

	/**
	 * Load chart data from API
	 */
	private loadChartData(period: string): void
	{
		// Unsubscribe from previous request if still pending
		this.subscription?.unsubscribe();

		this.isLoading.set(true);
		this.error.set(null);

		this.subscription = this.logChartService
			.getChartData(period)
			.subscribe({
				next: (data) =>
				{
					this.rawData.set(data);
					this.isLoading.set(false);
				},
				error: (err) =>
				{
					this.error.set(err.message || "Failed to load chart data");
					this.rawData.set(null);
					this.isLoading.set(false);
				}
			});
	}

	/**
	 * Format timestamp based on period
	 */
	private formatTimestamp(timestamp: string): string
	{
		const date = new Date(timestamp);
		const period = this.period();

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
		this.loadChartData(this.period());
	}
}
