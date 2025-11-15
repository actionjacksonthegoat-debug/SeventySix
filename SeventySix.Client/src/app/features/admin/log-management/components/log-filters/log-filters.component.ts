import {
	Component,
	ChangeDetectionStrategy,
	signal,
	output,
	viewChild,
	ElementRef,
	HostListener,
	OutputEmitterRef,
	Signal,
	WritableSignal
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatChipsModule } from "@angular/material/chips";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatSelectModule } from "@angular/material/select";
import { LogLevel, LogFilterRequest } from "@admin/log-management/models";
import { Subject } from "rxjs";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

/**
 * Log filters component for the log management page
 */
@Component({
	selector: "app-log-filters",
	imports: [
		FormsModule,
		MatFormFieldModule,
		MatInputModule,
		MatChipsModule,
		MatButtonModule,
		MatIconModule,
		MatSlideToggleModule,
		MatSelectModule
	],
	templateUrl: "./log-filters.component.html",
	styleUrl: "./log-filters.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogFiltersComponent
{
	// View children
	readonly searchInput: Signal<ElementRef<HTMLInputElement> | undefined> =
		viewChild<ElementRef<HTMLInputElement>>("searchInput");

	// State
	readonly searchTerm: WritableSignal<string> = signal<string>("");
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

	private searchSubject: Subject<string> = new Subject<string>();

	constructor()
	{
		// Set up debounced search
		this.searchSubject
			.pipe(
				debounceTime(300),
				distinctUntilChanged(),
				takeUntilDestroyed()
			)
			.subscribe((term) =>
			{
				this.searchTerm.set(term);
				this.emitFilterChange();
			});
	}

	onSearchChange(value: string): void
	{
		this.searchSubject.next(value);
	}

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
		this.searchTerm.set("");
		this.selectedLevel.set(null);
		this.dateRange.set("24h");
		this.emitFilterChange();
	}

	/**
	 * Keyboard shortcut handler
	 * Ctrl+F: Focus search input
	 */
	@HostListener("window:keydown", ["$event"])
	handleKeyboardShortcut(event: KeyboardEvent): void
	{
		// Ctrl+F or Cmd+F: Focus search
		if ((event.ctrlKey || event.metaKey) && event.key === "f")
		{
			event.preventDefault();
			this.searchInput()?.nativeElement.focus();
		}
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
			searchTerm: this.searchTerm() || "",
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
