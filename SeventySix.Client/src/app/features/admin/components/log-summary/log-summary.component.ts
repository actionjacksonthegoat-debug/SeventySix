import {
	Component,
	ChangeDetectionStrategy,
	input,
	computed
} from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { LogStatistics } from "@core/models/logs";

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
	statistics = input<LogStatistics | null>(null);
	lastUpdated = input<Date | null>(null);

	// Computed
	formattedTotal = computed(() =>
	{
		const stats = this.statistics();
		return stats ? this.formatNumber(stats.totalCount) : "";
	});

	formattedErrors = computed(() =>
	{
		const stats = this.statistics();
		return stats ? this.formatNumber(stats.errorCount) : "";
	});

	formattedWarnings = computed(() =>
	{
		const stats = this.statistics();
		return stats ? this.formatNumber(stats.warningCount) : "";
	});

	formattedFatals = computed(() =>
	{
		const stats = this.statistics();
		return stats ? this.formatNumber(stats.fatalCount) : "";
	});

	relativeTime = computed(() =>
	{
		const updated = this.lastUpdated();
		if (!updated)
		{
			return null;
		}

		const now = Date.now();
		const diff = now - updated.getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

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
