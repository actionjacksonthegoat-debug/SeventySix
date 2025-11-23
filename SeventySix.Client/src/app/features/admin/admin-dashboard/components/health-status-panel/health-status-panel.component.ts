import {
	Component,
	OnDestroy,
	signal,
	WritableSignal,
	computed,
	Signal,
	inject,
	ChangeDetectorRef
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
import { CreateQueryResult } from "@tanstack/angular-query-experimental";
import {
	HealthApiService,
	LogChartService
} from "@admin/admin-dashboard/services";
import { HealthStatus } from "@admin/admin-dashboard/models";
import { LogStatistics } from "@admin/log-management/models";
import { environment } from "@environments/environment";

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
export class HealthStatusPanelComponent implements OnDestroy
{
	private readonly healthApiService: HealthApiService =
		inject(HealthApiService);
	private readonly logChartService: LogChartService = inject(LogChartService);
	private readonly cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

	/**
	 * TanStack Query for health data
	 */
	readonly healthQuery: CreateQueryResult<HealthStatus, Error> =
		this.healthApiService.createHealthQuery();
	readonly statisticsQuery: CreateQueryResult<LogStatistics, Error> =
		this.logChartService.createStatisticsQuery();

	/**
	 * Loading state from queries
	 */
	readonly isLoading: Signal<boolean> = computed(
		() => this.healthQuery.isLoading() || this.statisticsQuery.isLoading()
	);

	/**
	 * Error state from queries
	 */
	readonly error: Signal<string | null> = computed(() =>
	{
		const healthErr: Error | null = this.healthQuery.error();
		const statsErr: Error | null = this.statisticsQuery.error();
		const err: Error | null = healthErr || statsErr;
		return err ? err.message || "Failed to load system data" : null;
	});

	/**
	 * Health data from query
	 */
	readonly healthData: Signal<HealthStatus | null> = computed(
		() => this.healthQuery.data() ?? null
	);

	/**
	 * Statistics data from query
	 */
	readonly statisticsData: Signal<LogStatistics | null> = computed(
		() => this.statisticsQuery.data() ?? null
	);

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

	constructor()
	{
		this.startAutoRefresh();

		// Schedule change detection after initialization to prevent ExpressionChangedAfterItHasBeenCheckedError
		setTimeout(() => this.cdr.markForCheck(), 0);
	}

	ngOnDestroy(): void
	{
		this.stopAutoRefresh();
	}

	/**
	 * Refresh health data
	 */
	onRefresh(): void
	{
		this.healthQuery.refetch();
		this.statisticsQuery.refetch();
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
				this.healthQuery.refetch();
				this.statisticsQuery.refetch();
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
