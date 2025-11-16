import {
	Component,
	OnInit,
	OnDestroy,
	signal,
	WritableSignal,
	computed,
	Signal
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatChipsModule } from "@angular/material/chips";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatButtonModule } from "@angular/material/button";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatDividerModule } from "@angular/material/divider";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatTooltipModule } from "@angular/material/tooltip";
import {
	HealthApiService,
	LogChartService
} from "@admin/admin-dashboard/services";
import { HealthStatus } from "@admin/admin-dashboard/models";
import { LogStatistics } from "@admin/log-management/models";
import { environment } from "@environments/environment";
import { forkJoin } from "rxjs";

/**
 * Component displaying system health status panel
 */
@Component({
	selector: "app-health-status-panel",
	standalone: true,
	imports: [
		CommonModule,
		MatCardModule,
		MatChipsModule,
		MatIconModule,
		MatProgressSpinnerModule,
		MatButtonModule,
		MatProgressBarModule,
		MatDividerModule,
		MatSlideToggleModule,
		MatTooltipModule
	],
	templateUrl: "./health-status-panel.component.html",
	styleUrl: "./health-status-panel.component.scss"
})
export class HealthStatusPanelComponent implements OnInit, OnDestroy
{
	readonly isLoading: WritableSignal<boolean> = signal<boolean>(false);
	readonly error: WritableSignal<string | null> = signal<string | null>(null);
	readonly healthData: WritableSignal<HealthStatus | null> =
		signal<HealthStatus | null>(null);
	readonly statisticsData: WritableSignal<LogStatistics | null> =
		signal<LogStatistics | null>(null);

	readonly autoRefreshEnabled: WritableSignal<boolean> = signal<boolean>(
		environment.dashboard.health.autoRefreshEnabled
	);
	readonly refreshIntervalSeconds: WritableSignal<number> = signal<number>(
		environment.dashboard.health.refreshIntervalSeconds
	);

	private refreshTimer?: ReturnType<typeof setInterval>;

	// Computed values
	readonly lastCheckedFormatted: Signal<string> = computed(() =>
	{
		const data: HealthStatus | null = this.healthData();
		if (!data?.checkedAt)
		{
			return "Never";
		}
		return this.formatTimestamp(data.checkedAt);
	});

	readonly memoryUsagePercent: Signal<number> = computed(() =>
	{
		const data: HealthStatus | null = this.healthData();
		if (!data?.system)
		{
			return 0;
		}
		return Math.round(
			(data.system.memoryUsedMb / data.system.memoryTotalMb) * 100
		);
	});

	readonly statusColor: Signal<string> = computed(() =>
	{
		const status: string | undefined = this.healthData()?.status;
		switch (status)
		{
			case "Healthy":
				return "primary";
			case "Degraded":
				return "accent";
			case "Unhealthy":
				return "warn";
			default:
				return "primary";
		}
	});

	readonly criticalIssuesCount: Signal<number> = computed(() =>
	{
		const data: HealthStatus | null = this.healthData();
		let count: number = 0;
		if (!data)
		{
			return count;
		}

		if (!data.database.isConnected)
		{
			count++;
		}
		if (data.system.cpuUsagePercent > 80)
		{
			count++;
		}
		if (this.memoryUsagePercent() > 80)
		{
			count++;
		}
		if (data.system.diskUsagePercent > 80)
		{
			count++;
		}
		if (data.errorQueue?.circuitBreakerOpen)
		{
			count++;
		}

		return count;
	});

	readonly errorRate: Signal<number> = computed(() =>
	{
		const stats: LogStatistics | null = this.statisticsData();
		if (!stats || stats.totalRequests === 0)
		{
			return 0;
		}
		return Math.round((stats.failedRequests / stats.totalRequests) * 100);
	});

	readonly topErrorSources: Signal<Array<{ name: string; count: number }>> =
		computed(() =>
		{
			const stats: LogStatistics | null = this.statisticsData();
			if (!stats || !stats.topErrorSources)
			{
				return [];
			}
			return Object.entries(stats.topErrorSources)
				.map(([name, count]) => ({ name, count }))
				.sort((a, b) => b.count - a.count)
				.slice(0, 5);
		});

	readonly topRequestPaths: Signal<Array<{ path: string; count: number }>> =
		computed(() =>
		{
			const stats: LogStatistics | null = this.statisticsData();
			if (!stats || !stats.requestsByPath)
			{
				return [];
			}
			return Object.entries(stats.requestsByPath)
				.map(([path, count]) => ({ path, count }))
				.sort((a, b) => b.count - a.count)
				.slice(0, 5);
		});

	constructor(
		private healthApiService: HealthApiService,
		private logChartService: LogChartService
	)
	{}

	ngOnInit(): void
	{
		this.loadHealthData();
		this.startAutoRefresh();
	}

	ngOnDestroy(): void
	{
		this.stopAutoRefresh();
	}

	/**
	 * Load health and statistics data from services
	 */
	private loadHealthData(): void
	{
		this.isLoading.set(true);
		this.error.set(null);

		forkJoin({
			health: this.healthApiService.getHealth(),
			statistics: this.logChartService.getStatistics()
		}).subscribe({
			next: ({ health, statistics }) =>
			{
				this.healthData.set(health);
				this.statisticsData.set(statistics);
				this.isLoading.set(false);
			},
			error: (err) =>
			{
				this.error.set(err.message || "Failed to load system data");
				this.healthData.set(null);
				this.statisticsData.set(null);
				this.isLoading.set(false);
			}
		});
	}

	/**
	 * Refresh health data
	 */
	onRefresh(): void
	{
		this.loadHealthData();
	}

	/**
	 * Toggle auto-refresh on/off
	 */
	toggleAutoRefresh(): void
	{
		this.autoRefreshEnabled.update((v) => !v);
		if (this.autoRefreshEnabled())
		{
			this.startAutoRefresh();
		}
		else
		{
			this.stopAutoRefresh();
		}
	}

	/**
	 * Start auto-refresh timer
	 */
	private startAutoRefresh(): void
	{
		this.stopAutoRefresh();
		if (this.autoRefreshEnabled())
		{
			this.refreshTimer = setInterval(() =>
			{
				this.loadHealthData();
			}, this.refreshIntervalSeconds() * 1000);
		}
	}

	/**
	 * Stop auto-refresh timer
	 */
	private stopAutoRefresh(): void
	{
		if (this.refreshTimer)
		{
			clearInterval(this.refreshTimer);
			this.refreshTimer = undefined;
		}
	}

	/**
	 * Format ISO timestamp as relative time
	 */
	private formatTimestamp(isoString: string): string
	{
		const date: Date = new Date(isoString);
		const now: Date = new Date();
		const diffMs: number = now.getTime() - date.getTime();
		const diffSec: number = Math.floor(diffMs / 1000);

		if (diffSec < 60)
		{
			return `${diffSec}s ago`;
		}
		const diffMin: number = Math.floor(diffSec / 60);
		if (diffMin < 60)
		{
			return `${diffMin}m ago`;
		}
		const diffHour: number = Math.floor(diffMin / 60);
		if (diffHour < 24)
		{
			return `${diffHour}h ago`;
		}
		return date.toLocaleString();
	}

	/**
	 * Get icon name for status
	 */
	getStatusIcon(status: string): string
	{
		switch (status)
		{
			case "Healthy":
				return "check_circle";
			case "Degraded":
				return "warning";
			case "Unhealthy":
				return "error";
			default:
				return "help";
		}
	}

	/**
	 * Get CSS class for resource usage level
	 */
	getResourceStatusClass(percent: number): string
	{
		if (percent > 80)
		{
			return "critical";
		}
		if (percent > 60)
		{
			return "warning";
		}
		return "normal";
	}
}
