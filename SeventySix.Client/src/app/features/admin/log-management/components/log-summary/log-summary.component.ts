import {
	Component,
	ChangeDetectionStrategy,
	input,
	computed,
	InputSignal,
	Signal
} from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { LogStatistics } from "@admin/log-management/models";

/**
 * Log summary component displaying key statistics
 */
@Component({
	selector: "app-log-summary",
	imports: [MatCardModule, MatIconModule],
	templateUrl: "./log-summary.component.html",
	styleUrl: "./log-summary.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogSummaryComponent
{
	// Inputs
	readonly statistics: InputSignal<LogStatistics | null> =
		input<LogStatistics | null>(null);
	readonly lastUpdated: InputSignal<Date | null> = input<Date | null>(null);

	// Computed
	readonly formattedTotal: Signal<string> = computed(() =>
	{
		const stats: LogStatistics | null = this.statistics();
		return stats ? this.formatNumber(stats.totalLogs) : "";
	});

	readonly formattedErrors: Signal<string> = computed(() =>
	{
		const stats: LogStatistics | null = this.statistics();
		return stats ? this.formatNumber(stats.errorCount) : "";
	});

	readonly formattedWarnings: Signal<string> = computed(() =>
	{
		const stats: LogStatistics | null = this.statistics();
		return stats ? this.formatNumber(stats.warningCount) : "";
	});

	readonly formattedFatals: Signal<string> = computed(() =>
	{
		const stats: LogStatistics | null = this.statistics();
		return stats ? this.formatNumber(stats.criticalCount) : "";
	});

	readonly relativeTime: Signal<string | null> = computed(() =>
	{
		const updated: Date | null = this.lastUpdated();
		if (!updated)
		{
			return null;
		}

		const now: number = Date.now();
		const diff: number = now - updated.getTime();
		const minutes: number = Math.floor(diff / 60000);
		const hours: number = Math.floor(diff / 3600000);
		const days: number = Math.floor(diff / 86400000);

		if (days > 0)
		{
			return `${days} day${days > 1 ? "s" : ""} ago`;
		}
		if (hours > 0)
		{
			return `${hours} hour${hours > 1 ? "s" : ""} ago`;
		}
		if (minutes > 0)
		{
			return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
		}
		return "just now";
	});

	private formatNumber(value: number): string
	{
		return value.toLocaleString();
	}
}
