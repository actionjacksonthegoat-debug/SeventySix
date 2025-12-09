import {
	Component,
	input,
	InputSignal,
	output,
	OutputEmitterRef,
	computed,
	Signal,
	signal,
	WritableSignal,
	effect,
	ChangeDetectionStrategy,
	OnDestroy,
	inject
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { Subject } from "rxjs";
import { map } from "rxjs/operators";
import { DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatTableModule } from "@angular/material/table";
import { MatPaginatorModule, PageEvent } from "@angular/material/paginator";
import { MatSortModule, Sort } from "@angular/material/sort";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatChipsModule } from "@angular/material/chips";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatTooltipModule } from "@angular/material/tooltip";
import { SelectionModel } from "@angular/cdk/collections";
import {
	TableColumn,
	QuickFilter,
	RowAction,
	BulkAction,
	RowActionEvent,
	BulkActionEvent,
	FilterChangeEvent,
	DateRangeEvent,
	SortChangeEvent
} from "@shared/models";
import { MatCard, MatCardContent } from "@angular/material/card";
import { ScrollingModule } from "@angular/cdk/scrolling";
import { TableHeightDirective } from "@shared/directives";
import { slideDown } from "@shared/animations/animations";
import { environment } from "@environments/environment";
import { DateService } from "@infrastructure/services";

/**
 * Generic data table component
 * Provides reusable table infrastructure for feature components
 * Follows Material Design 3 patterns with OnPush change detection
 */
@Component({
	selector: "app-data-table",
	imports: [
		DatePipe,
		FormsModule,
		MatTableModule,
		MatPaginatorModule,
		MatSortModule,
		MatCheckboxModule,
		MatButtonModule,
		MatIconModule,
		MatMenuModule,
		MatFormFieldModule,
		MatInputModule,
		MatChipsModule,
		MatProgressSpinnerModule,
		MatTooltipModule,
		MatCard,
		MatCardContent,
		ScrollingModule,
		TableHeightDirective
	],
	templateUrl: "./data-table.component.html",
	styleUrl: "./data-table.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
	animations: [slideDown]
})
export class DataTableComponent<T extends { id: number }> implements OnDestroy
{
	// ========================================
	// Required Inputs
	// ========================================

	/**
	 * Column definitions
	 */
	readonly columns: InputSignal<TableColumn<T>[]> =
		input.required<TableColumn<T>[]>();

	/**
	 * Table data (current page items)
	 */
	readonly data: InputSignal<T[]> = input.required<T[]>();

	/**
	 * Loading state
	 */
	readonly isLoading: InputSignal<boolean> = input.required<boolean>();

	/**
	 * Total items across all pages
	 */
	readonly totalCount: InputSignal<number> = input.required<number>();

	/**
	 * Current page (0-based)
	 */
	readonly pageIndex: InputSignal<number> = input.required<number>();

	/**
	 * Items per page
	 */
	readonly pageSize: InputSignal<number> = input.required<number>();

	// ========================================
	// Optional Inputs
	// ========================================

	/**
	 * Error message
	 */
	readonly error: InputSignal<string | null> = input<string | null>(null);

	/**
	 * Enable search
	 */
	readonly searchable: InputSignal<boolean> = input<boolean>(true);

	/**
	 * Enable bulk selection (checkbox column)
	 */
	readonly selectable: InputSignal<boolean> = input<boolean>(false);

	/**
	 * Show "Select All" checkbox in header
	 */
	readonly showSelectAll: InputSignal<boolean> = input<boolean>(false);

	/**
	 * Show create button
	 */
	readonly showCreate: InputSignal<boolean> = input<boolean>(false);

	/**
	 * Show refresh button
	 */
	readonly showRefresh: InputSignal<boolean> = input<boolean>(true);

	/**
	 * Quick filters (status/level chips)
	 */
	readonly quickFilters: InputSignal<QuickFilter<T>[]> = input<
		QuickFilter<T>[]
	>([]);

	/**
	 * Single-selection mode for quick filters
	 * When true, only one filter can be active at a time
	 */
	readonly quickFiltersSingleSelection: InputSignal<boolean> =
		input<boolean>(false);

	/**
	 * Enable date range filter
	 */
	readonly dateRangeEnabled: InputSignal<boolean> = input<boolean>(false);

	/**
	 * Page size options
	 */
	readonly pageSizeOptions: InputSignal<number[]> = input<number[]>([
		25, 50, 100
	]);

	/**
	 * Virtual scroll item size (from environment config)
	 */
	readonly virtualScrollItemSize: InputSignal<number> = input<number>(
		environment.ui.tables.virtualScrollItemSize
	);

	/**
	 * localStorage key for column preferences
	 */
	readonly storageKey: InputSignal<string | null> = input<string | null>(
		null
	);

	/**
	 * Per-row action menu items
	 */
	readonly rowActions: InputSignal<RowAction<T>[]> = input<RowAction<T>[]>(
		[]
	);

	/**
	 * Bulk action menu items (shown when rows selected)
	 */
	readonly bulkActions: InputSignal<BulkAction[]> = input<BulkAction[]>([]);

	// ========================================
	// Outputs
	// ========================================

	/**
	 * Row clicked
	 */
	readonly rowClick: OutputEmitterRef<T> = output<T>();

	/**
	 * Create button clicked
	 */
	readonly createClick: OutputEmitterRef<void> = output<void>();

	/**
	 * Refresh button clicked
	 */
	readonly refreshClick: OutputEmitterRef<void> = output<void>();

	/**
	 * Per-row action triggered
	 */
	readonly rowAction: OutputEmitterRef<RowActionEvent<T>> =
		output<RowActionEvent<T>>();

	/**
	 * Bulk action triggered
	 */
	readonly bulkAction: OutputEmitterRef<BulkActionEvent<T>> =
		output<BulkActionEvent<T>>();

	/**
	 * Search text changed (debounced)
	 */
	readonly searchChange: OutputEmitterRef<string> = output<string>();

	/**
	 * Quick filter changed
	 */
	readonly filterChange: OutputEmitterRef<FilterChangeEvent> =
		output<FilterChangeEvent>();

	/**
	 * Date range changed
	 */
	readonly dateRangeChange: OutputEmitterRef<DateRangeEvent> =
		output<DateRangeEvent>();

	/**
	 * Page changed (0-based index)
	 */
	readonly pageChange: OutputEmitterRef<number> = output<number>();

	/**
	 * Page size changed
	 */
	readonly pageSizeChange: OutputEmitterRef<number> = output<number>();

	/**
	 * Sort column/direction changed
	 */
	readonly sortChange: OutputEmitterRef<SortChangeEvent> =
		output<SortChangeEvent>();

	// ========================================
	// Internal State
	// ========================================

	/**
	 * Search text
	 */
	readonly searchText: WritableSignal<string> = signal("");

	/**
	 * Destroy subject for cleanup
	 */
	private readonly destroy$: Subject<void> = new Subject<void>();

	/**
	 * Date service for date operations
	 */
	private readonly dateService: DateService = inject(DateService);

	/**
	 * Active quick filters
	 */
	readonly activeFilters: WritableSignal<Set<string>> = signal(new Set());

	/**
	 * Selected date range
	 */
	readonly selectedDateRange: WritableSignal<string> = signal("24h");

	/**
	 * Date range display configuration (DRY - single source of truth)
	 */
	private static readonly DATE_RANGE_CONFIG: Record<
		string,
		{ icon: string; label: string }
	> = {
		"1h": { icon: "schedule", label: "1 Hour" },
		"24h": { icon: "today", label: "24 Hours" },
		"7d": { icon: "date_range", label: "7 Days" },
		"30d": { icon: "calendar_month", label: "30 Days" }
	};

	/**
	 * Computed date range icon (memoized for template performance)
	 */
	readonly dateRangeIcon: Signal<string> = computed(
		(): string =>
			DataTableComponent.DATE_RANGE_CONFIG[this.selectedDateRange()]
				?.icon ?? "today"
	);

	/**
	 * Computed date range label (memoized for template performance)
	 */
	readonly dateRangeLabel: Signal<string> = computed(
		(): string =>
			DataTableComponent.DATE_RANGE_CONFIG[this.selectedDateRange()]
				?.label ?? "24 Hours"
	);

	/**
	 * Column visibility state
	 */
	private readonly columnVisibility: WritableSignal<Map<string, boolean>> =
		signal(new Map());

	/**
	 * Selection model for bulk actions
	 */
	readonly selection: SelectionModel<T> = new SelectionModel<T>(true, []);

	/**
	 * Selection change signal - triggers when selection changes
	 */
	private readonly selectionChange: Signal<readonly T[]> = toSignal(
		this.selection.changed.pipe(
			map(() => this.selection.selected as readonly T[])
		),
		{ initialValue: [] as readonly T[] }
	);

	// ========================================
	// Computed Signals
	// ========================================

	/**
	 * Visible columns
	 */
	readonly visibleColumns: Signal<TableColumn<T>[]> = computed(() =>
	{
		const visibility: Map<string, boolean> = this.columnVisibility();
		return this.columns().filter((col) =>
		{
			const isVisible: boolean | undefined = visibility.get(col.key);
			return isVisible !== undefined ? isVisible : col.visible;
		});
	});

	/**
	 * Displayed column keys for mat-table
	 */
	readonly displayedColumns: Signal<string[]> = computed(() =>
	{
		const columns: string[] = [];

		// Add select column if selectable
		if (this.selectable())
		{
			columns.push("select");
		}

		// Add visible data columns
		columns.push(...this.visibleColumns().map((col) => col.key));

		// Add actions column if rowActions provided
		if (this.rowActions().length > 0)
		{
			columns.push("actions");
		}

		return columns;
	});

	/**
	 * Has selection
	 */
	readonly hasSelection: Signal<boolean> = computed(
		() => this.selectionChange().length > 0
	);

	/**
	 * Number of selected items
	 */
	readonly selectedCount: Signal<number> = computed(
		() => this.selectionChange().length
	);

	/**
	 * Is all selected
	 */
	readonly isAllSelected: Signal<boolean> = computed(() =>
	{
		const numSelected: number = this.selectionChange().length;
		const numRows: number = this.data().length;
		return numSelected === numRows && numRows > 0;
	});

	// ========================================
	// Constructor & Lifecycle
	// ========================================

	/**
	 * Track whether initial date range has been emitted
	 */
	private initialDateRangeEmitted: boolean = false;

	constructor()
	{
		// Initialize first quick filter as active in single-selection mode
		effect(() =>
		{
			const filters: QuickFilter<T>[] = this.quickFilters();
			const singleSelection: boolean = this.quickFiltersSingleSelection();
			const currentFilters: Set<string> = this.activeFilters();

			// Only initialize if single-selection mode, has filters, and no filter is active yet
			if (
				singleSelection
				&& filters.length > 0
				&& currentFilters.size === 0
			)
			{
				// Activate the first filter (typically "All")
				const firstFilterKey: string = filters[0].key;
				this.activeFilters.set(new Set([firstFilterKey]));
				// Emit the initial filter state
				this.filterChange.emit({
					filterKey: firstFilterKey,
					active: true
				});
			}
		});

		// Emit initial date range when dateRangeEnabled is set
		effect(() =>
		{
			const enabled: boolean = this.dateRangeEnabled();
			if (enabled && !this.initialDateRangeEmitted)
			{
				this.initialDateRangeEmitted = true;
				// Emit the default 24h date range on initialization
				const range: string = this.selectedDateRange();
				this.onDateRangeChange(range);
			}
		});

		// Load column preferences from localStorage
		effect(() =>
		{
			const key: string | null = this.storageKey();
			if (key)
			{
				const stored: string | null = localStorage.getItem(key);
				if (stored)
				{
					try
					{
						const preferences: Record<string, unknown> =
							JSON.parse(stored);
						const visibility: Map<string, boolean> = new Map<
							string,
							boolean
						>();
						Object.entries(preferences).forEach(([k, v]) =>
						{
							visibility.set(k, v as boolean);
						});
						this.columnVisibility.set(visibility);
					}
					catch
					{
						// Invalid JSON, ignore
					}
				}
			}
		});

		// Clear selection when data changes
		effect(() =>
		{
			this.data();
			this.selection.clear();
		});
	}

	/**
	 * Cleanup subscriptions on destroy
	 */
	ngOnDestroy(): void
	{
		this.destroy$.next();
		this.destroy$.complete();
	}

	// ========================================
	// Event Handlers
	// ========================================

	/**
	 * Handle search input change
	 */
	onSearchChange(searchText: string): void
	{
		this.searchText.set(searchText);
	}

	/**
	 * Execute search (Enter key or search button click)
	 */
	onSearch(): void
	{
		const searchText: string = this.searchText();
		this.searchChange.emit(searchText);
	}

	/**
	 * Handle sort change from mat-sort
	 * @param sort - Material sort event
	 */
	onSortChange(sort: Sort): void
	{
		this.sortChange.emit({
			sortBy: sort.active,
			sortDescending: sort.direction === "desc"
		});
	}

	/**
	 * Handle filter toggle
	 */
	onFilterToggle(filterKey: string): void
	{
		const filters: Set<string> = new Set(this.activeFilters());
		const wasActive: boolean = filters.has(filterKey);
		const active: boolean = !wasActive;

		// Single-selection mode: clear all other filters
		if (this.quickFiltersSingleSelection() && active)
		{
			filters.clear();
			filters.add(filterKey);
		}
		else
		{
			// Multi-selection mode
			if (active)
			{
				filters.add(filterKey);
			}
			else
			{
				filters.delete(filterKey);
			}
		}

		this.activeFilters.set(filters);
		this.filterChange.emit({ filterKey, active });
	}

	/**
	 * Handle date range change
	 */
	onDateRangeChange(range: string): void
	{
		this.selectedDateRange.set(range);

		const now: Date = this.dateService.parseUTC(this.dateService.now());
		let startDate: Date | undefined;

		switch (range)
		{
			case "1h":
				startDate = new Date(now.getTime() - 60 * 60 * 1000);
				this.dateRangeChange.emit({
					startDate,
					endDate: now,
					preset: "24h" // Map to closest preset
				});
				break;
			case "24h":
				startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
				this.dateRangeChange.emit({
					startDate,
					endDate: now,
					preset: "24h"
				});
				break;
			case "7d":
				startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
				this.dateRangeChange.emit({
					startDate,
					endDate: now,
					preset: "7d"
				});
				break;
			case "30d":
				startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
				this.dateRangeChange.emit({
					startDate,
					endDate: now,
					preset: "30d"
				});
				break;
		}
	}

	/**
	 * Handle row click
	 */
	onRowClick(row: T): void
	{
		this.rowClick.emit(row);
	}

	/**
	 * Handle row action
	 */
	onRowAction(action: string, row: T): void
	{
		this.rowAction.emit({ action, row });
	}

	/**
	 * Handle bulk action
	 */
	onBulkAction(action: string): void
	{
		this.bulkAction.emit({
			action,
			selectedRows: this.selection.selected,
			selectedIds: this.selection.selected.map((row) => row.id)
		});
	}

	/**
	 * Handle page change
	 */
	onPageChange(event: PageEvent): void
	{
		if (event.pageIndex !== this.pageIndex())
		{
			this.pageChange.emit(event.pageIndex);
		}

		if (event.pageSize !== this.pageSize())
		{
			this.pageSizeChange.emit(event.pageSize);
		}
	}

	/**
	 * Handle create button
	 */
	onCreate(): void
	{
		this.createClick.emit();
	}

	/**
	 * Handle refresh button
	 */
	onRefresh(): void
	{
		this.refreshClick.emit();
	}

	/**
	 * Toggle column visibility
	 */
	toggleColumn(columnKey: string): void
	{
		const visibility: Map<string, boolean> = new Map(
			this.columnVisibility()
		);
		const currentValue: boolean | undefined = visibility.get(columnKey);
		const column: TableColumn<T> | undefined = this.columns().find(
			(c) => c.key === columnKey
		);

		if (column)
		{
			const newValue: boolean =
				currentValue !== undefined ? !currentValue : !column.visible;
			visibility.set(columnKey, newValue);
			this.columnVisibility.set(visibility);

			// Save to localStorage if key provided
			const key: string | null = this.storageKey();
			if (key)
			{
				const preferences: Record<string, boolean> = {};
				visibility.forEach((value, k) =>
				{
					preferences[k] = value;
				});
				localStorage.setItem(key, JSON.stringify(preferences));
			}
		}
	}

	/**
	 * Toggle all rows selection
	 */
	toggleAllRows(): void
	{
		if (this.isAllSelected())
		{
			this.selection.clear();
		}
		else
		{
			this.data().forEach((row) => this.selection.select(row));
		}
	}

	/**
	 * Check if action should be shown for row
	 */
	shouldShowAction(action: RowAction<T>, row: T): boolean
	{
		return action.showIf ? action.showIf(row) : true;
	}

	/**
	 * Check if a column is currently visible
	 * @param key - Column key to check
	 * @returns true if column is visible
	 */
	protected columnVisible(key: string): boolean
	{
		const visibility: Map<string, boolean> = this.columnVisibility();
		const column: TableColumn<T> | undefined = this.columns().find(
			(c: TableColumn<T>): boolean => c.key === key
		);
		return visibility.get(key) ?? column?.visible ?? true;
	}
}
