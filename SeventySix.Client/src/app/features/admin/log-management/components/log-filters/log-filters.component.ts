import {
	Component,
	ChangeDetectionStrategy,
	signal,
	output,
	OutputEmitterRef,
	WritableSignal
} from "@angular/core";
import { MatChipsModule } from "@angular/material/chips";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { LogLevel, LogFilterRequest } from "@admin/log-management/models";

/**
 * Log filters component for the log management page
 */
@Component({
	selector: "app-log-filters",
	imports: [
		MatChipsModule,
		MatButtonModule,
		MatIconModule,
		MatSlideToggleModule
	],
	templateUrl: "./log-filters.component.html",
	styleUrl: "./log-filters.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogFiltersComponent
{
	// State
	readonly selectedLevel: WritableSignal<LogLevel | null> =
		signal<LogLevel | null>(null);
	readonly dateRange: WritableSignal<string> = signal<string>("24h");
	readonly autoRefresh: WritableSignal<boolean> = signal<boolean>(false);

	// Events
	readonly filterChange: OutputEmitterRef<LogFilterRequest> =
		output<LogFilterRequest>();
	readonly autoRefreshChange: OutputEmitterRef<boolean> = output<boolean>();
	readonly exportCsv: OutputEmitterRef<void> = output<void>();
	readonly cleanupLogs: OutputEmitterRef<void> = output<void>();

	// Options
	readonly levelOptions: LogLevel[] = [
		LogLevel.Verbose,
		LogLevel.Debug,
		LogLevel.Information,
		LogLevel.Warning,
		LogLevel.Error,
		LogLevel.Fatal
	];

	readonly dateRangeOptions: string[] = ["24h", "7d", "30d"];

	onLevelChange(level: LogLevel | null): void
	{
		this.selectedLevel.set(level);
		this.emitFilterChange();
	}

	onDateRangeChange(range: string): void
	{
		this.dateRange.set(range);
		this.emitFilterChange();
	}

	onAutoRefreshToggle(enabled: boolean): void
	{
		this.autoRefresh.set(enabled);
		this.autoRefreshChange.emit(enabled);
	}

	onExportClick(): void
	{
		this.exportCsv.emit();
	}

	onCleanupClick(): void
	{
		this.cleanupLogs.emit();
	}

	clearFilters(): void
	{
		this.selectedLevel.set(null);
		this.dateRange.set("24h");
		this.emitFilterChange();
	}

	getLevelName(level: LogLevel): string
	{
		const names: Record<LogLevel, string> = {
			[LogLevel.Verbose]: "Verbose",
			[LogLevel.Debug]: "Debug",
			[LogLevel.Information]: "Info",
			[LogLevel.Warning]: "Warning",
			[LogLevel.Error]: "Error",
			[LogLevel.Fatal]: "Fatal"
		};
		return names[level];
	}

	getDateRangeLabel(range: string): string
	{
		const labels: Record<string, string> = {
			"24h": "Last 24 Hours",
			"7d": "Last 7 Days",
			"30d": "Last 30 Days"
		};
		return labels[range] || range;
	}

	private emitFilterChange(): void
	{
		const { startDate, endDate }: { startDate?: Date; endDate?: Date } =
			this.getDateRange();

		const filter: LogFilterRequest = {
			pageNumber: 1,
			pageSize: 50,
			logLevel: this.selectedLevel(),
			startDate,
			endDate
		};

		this.filterChange.emit(filter);
	}

	private getDateRange(): { startDate?: Date; endDate?: Date }
	{
		const now: Date = new Date();
		const range: string = this.dateRange();

		let startDate: Date | undefined;

		switch (range)
		{
			case "24h":
				startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
				break;
			case "7d":
				startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
				break;
			case "30d":
				startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
				break;
			default:
				startDate = undefined;
		}

		return {
			startDate,
			endDate: startDate ? now : undefined
		};
	}
}
