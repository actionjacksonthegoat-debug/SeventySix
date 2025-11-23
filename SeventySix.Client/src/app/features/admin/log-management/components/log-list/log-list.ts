import {
	Component,
	computed,
	inject,
	Signal,
	signal,
	WritableSignal,
	output,
	OutputEmitterRef,
	ChangeDetectionStrategy
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatMenuModule } from "@angular/material/menu";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatChipsModule } from "@angular/material/chips";
import { MatTooltipModule } from "@angular/material/tooltip";
import { LogManagementService } from "@admin/log-management/services";
import { LogFiltersComponent } from "@admin/log-management/components/log-filters/log-filters.component";
import { LogTableComponent } from "@admin/log-management/components/log-table/log-table.component";
import {
	LogResponse,
	LogFilterRequest,
	PagedLogResponse
} from "@admin/log-management/models";

interface ColumnDefinition
{
	key: string;
	label: string;
	visible: boolean;
}

/**
 * Log list component.
 * Displays list of logs with filtering, search, and pagination.
 * Follows OnPush change detection for performance.
 * Uses signals for reactive state management.
 */
@Component({
	selector: "app-log-list",
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		MatCardModule,
		MatProgressSpinnerModule,
		MatIconModule,
		MatButtonModule,
		MatExpansionModule,
		MatFormFieldModule,
		MatInputModule,
		MatMenuModule,
		MatCheckboxModule,
		MatChipsModule,
		MatTooltipModule,
		LogFiltersComponent,
		LogTableComponent
	],
	templateUrl: "./log-list.html",
	styleUrl: "./log-list.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogList
{
	private readonly logService: LogManagementService =
		inject(LogManagementService);

	// Output events for parent component
	readonly logSelected: OutputEmitterRef<LogResponse> = output<LogResponse>();
	readonly deleteLog: OutputEmitterRef<number> = output<number>();
	readonly deleteSelected: OutputEmitterRef<number[]> = output<number[]>();

	// UI state
	readonly filtersExpanded: WritableSignal<boolean> = signal(false);
	readonly searchFilter: WritableSignal<string> = signal("");

	// Column configuration
	readonly columns: WritableSignal<ColumnDefinition[]> = signal([
		{ key: "select", label: "Select", visible: true },
		{ key: "level", label: "Level", visible: true },
		{ key: "timestamp", label: "Timestamp", visible: true },
		{ key: "message", label: "Message", visible: true },
		{ key: "sourceContext", label: "Source", visible: true },
		{ key: "requestPath", label: "Request Path", visible: false },
		{ key: "stackTrace", label: "Stack Trace", visible: false },
		{ key: "actions", label: "Actions", visible: true }
	]);

	// TanStack Query state
	readonly logsQuery: ReturnType<LogManagementService["getLogs"]> =
		this.logService.getLogs();

	// Computed signals
	readonly logs: Signal<PagedLogResponse | null> = computed(
		(): PagedLogResponse | null => this.logsQuery.data() ?? null
	);
	readonly isLoading: Signal<boolean> = computed((): boolean =>
		this.logsQuery.isLoading()
	);
	readonly error: Signal<string | null> = computed((): string | null =>
		this.logsQuery.error() ? "Failed to load logs. Please try again." : null
	);

	readonly displayedColumns: Signal<string[]> = computed((): string[] =>
		this.columns()
			.filter((col: ColumnDefinition): boolean => col.visible)
			.map((col: ColumnDefinition): string => col.key)
	);

	readonly errorCount: Signal<number> = computed((): number =>
	{
		const logsData: PagedLogResponse | null = this.logs();
		if (!logsData)
		{
			return 0;
		}
		return logsData.data.filter(
			(log: LogResponse): boolean =>
				log.logLevel?.toLowerCase() === "error"
		).length;
	});

	readonly warningCount: Signal<number> = computed((): number =>
	{
		const logsData: PagedLogResponse | null = this.logs();
		if (!logsData)
		{
			return 0;
		}
		return logsData.data.filter(
			(log: LogResponse): boolean =>
				log.logLevel?.toLowerCase() === "warning"
		).length;
	});

	toggleColumn(key: string): void
	{
		this.columns.update((cols: ColumnDefinition[]): ColumnDefinition[] =>
			cols.map(
				(col: ColumnDefinition): ColumnDefinition =>
					col.key === key ? { ...col, visible: !col.visible } : col
			)
		);
	}

	applySearch(): void
	{
		const search: string = this.searchFilter().trim();
		this.logService.updateFilter({ searchTerm: search || undefined });
	}

	clearSearch(): void
	{
		this.searchFilter.set("");
		this.applySearch();
	}

	onRetry(): void
	{
		void this.logsQuery.refetch();
	}

	onFilterChange(filter: Partial<LogFilterRequest>): void
	{
		this.logService.updateFilter(filter);
	}

	onPageChange(pageIndex: number): void
	{
		this.logService.setPage(pageIndex + 1);
	}

	onPageSizeChange(pageSize: number): void
	{
		this.logService.setPageSize(pageSize);
	}

	onLogSelected(log: LogResponse): void
	{
		this.logSelected.emit(log);
	}

	onDeleteLog(id: number): void
	{
		this.deleteLog.emit(id);
	}

	onDeleteSelected(ids: number[]): void
	{
		this.deleteSelected.emit(ids);
	}
}
