import { SelectionModel } from "@angular/cdk/collections";
import { ScrollingModule } from "@angular/cdk/scrolling";
import { DatePipe } from "@angular/common";
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	effect,
	inject,
	input,
	InputSignal,
	output,
	OutputEmitterRef,
	Signal,
	signal,
	WritableSignal
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { MatCard, MatCardContent } from "@angular/material/card";
import { PageEvent } from "@angular/material/paginator";
import { Sort } from "@angular/material/sort";
import { environment } from "@environments/environment";
import { slideDown } from "@shared/animations/animations";
import { SKELETON_CHECKBOX, SKELETON_ICON_BUTTON, SKELETON_TABLE_CELL, SkeletonTheme } from "@shared/constants";
import { TableHeightDirective } from "@shared/directives";
import { TABLE_MATERIAL_MODULES } from "@shared/material-bundles";
import {
	BulkAction,
	BulkActionEvent,
	DateRangeEvent,
	FilterChangeEvent,
	QuickFilter,
	RowAction,
	RowActionEvent,
	SortChangeEvent,
	TableColumn
} from "@shared/models";
import { DateService } from "@shared/services";
import { DataTableUtilities } from "@shared/utilities";
import { NgxSkeletonLoaderModule } from "ngx-skeleton-loader";
import { map } from "rxjs/operators";

/**
 * Generic data table component
 * Provides reusable table infrastructure for feature components
 * Follows Material Design 3 patterns with OnPush change detection
 * Angular 20+ compliant: signals, zoneless, inject() pattern
 */
@Component(
	{
		selector: "app-data-table",
		imports: [
			DatePipe,
			FormsModule,
			MatCard,
			MatCardContent,
			NgxSkeletonLoaderModule,
			ScrollingModule,
			TableHeightDirective,
			...TABLE_MATERIAL_MODULES
		],
		templateUrl: "./data-table.component.html",
		styleUrl: "./data-table.component.scss",
		changeDetection: ChangeDetectionStrategy.OnPush,
		animations: [slideDown]
	})
export class DataTableComponent<T extends { id: number; }>
{
	// Skeleton themes for table loading states
	readonly skeletonTableCell: SkeletonTheme = SKELETON_TABLE_CELL;
	readonly skeletonCheckbox: SkeletonTheme = SKELETON_CHECKBOX;
	readonly skeletonIconButton: SkeletonTheme =
		SKELETON_ICON_BUTTON;

	/**
	 * Skeleton placeholder ID - must be negative to trigger skeleton rendering.
	 */
	private static readonly SKELETON_ROW_ID: number = -1;

	/**
	 * Table data source - shows skeleton placeholder row when loading
	 */
	readonly tableDataSource: Signal<T[]> =
		computed(
			() =>
			{
				if (this.isLoading())
				{
					return [{ id: DataTableComponent.SKELETON_ROW_ID } as T];
				}
				return this.data();
			});

	// ===== Required Inputs =====

	/** Column definitions */
	readonly columns: InputSignal<TableColumn<T>[]> =
		input.required<TableColumn<T>[]>();

	/** Table data (current page items) */
	readonly data: InputSignal<T[]> =
		input.required<T[]>();

	/** Loading state */
	readonly isLoading: InputSignal<boolean> =
		input.required<boolean>();

	/** Total items across all pages */
	readonly totalCount: InputSignal<number> =
		input.required<number>();

	/** Current page (0-based) */
	readonly pageIndex: InputSignal<number> =
		input.required<number>();

	/** Items per page */
	readonly pageSize: InputSignal<number> =
		input.required<number>();

	// ===== Optional Inputs =====

	/** Error message */
	readonly error: InputSignal<string | null> =
		input<string | null>(null);

	/**
	 * Enable search
	 */
	readonly searchable: InputSignal<boolean> =
		input<boolean>(true);

	/**
	 * Enable bulk selection (checkbox column)
	 */
	readonly selectable: InputSignal<boolean> =
		input<boolean>(false);

	/**
	 * Show "Select All" checkbox in header
	 */
	readonly showSelectAll: InputSignal<boolean> =
		input<boolean>(false);

	/**
	 * Show create button
	 */
	readonly showCreate: InputSignal<boolean> =
		input<boolean>(false);

	/**
	 * Show refresh button
	 */
	readonly showRefresh: InputSignal<boolean> =
		input<boolean>(true);

	/**
	 * Quick filters (status/level chips)
	 */
	readonly quickFilters: InputSignal<QuickFilter<T>[]> =
		input<
			QuickFilter<T>[]>([]);

	/**
	 * Single-selection mode for quick filters
	 * When true, only one filter can be active at a time
	 */
	readonly quickFiltersSingleSelection: InputSignal<boolean> =
		input<boolean>(false);

	/**
	 * Enable date range filter
	 */
	readonly dateRangeEnabled: InputSignal<boolean> =
		input<boolean>(false);

	/**
	 * Page size options
	 */
	readonly pageSizeOptions: InputSignal<number[]> =
		input<number[]>(
			[
				25,
				50,
				100
			]);

	/**
	 * Virtual scroll item size (from environment config)
	 */
	readonly virtualScrollItemSize: InputSignal<number> =
		input<number>(
			environment.ui.tables.virtualScrollItemSize);

	/**
	 * localStorage key for column preferences
	 */
	readonly storageKey: InputSignal<string | null> =
		input<string | null>(
			null);

	/**
	 * Per-row action menu items
	 */
	readonly rowActions: InputSignal<RowAction<T>[]> =
		input<RowAction<T>[]>(
			[]);

	/**
	 * Bulk action menu items (shown when rows selected)
	 */
	readonly bulkActions: InputSignal<BulkAction[]> =
		input<BulkAction[]>([]);

	// ========================================
	// Outputs
	// ========================================

	/**
	 * Row clicked
	 */
	readonly rowClick: OutputEmitterRef<T> =
		output<T>();

	/**
	 * Create button clicked
	 */
	readonly createClick: OutputEmitterRef<void> =
		output<void>();

	/**
	 * Refresh button clicked
	 */
	readonly refreshClick: OutputEmitterRef<void> =
		output<void>();

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
	readonly searchChange: OutputEmitterRef<string> =
		output<string>();

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
	readonly pageChange: OutputEmitterRef<number> =
		output<number>();

	/**
	 * Page size changed
	 */
	readonly pageSizeChange: OutputEmitterRef<number> =
		output<number>();

	/**
	 * Sort column/direction changed
	 */
	readonly sortChange: OutputEmitterRef<SortChangeEvent> =
		output<SortChangeEvent>();

	// ========================================
	// Internal State
	// ========================================

	/**
	 * Search text (debounced)
	 */
	readonly searchText: WritableSignal<string> =
		signal("");

	/**
	 * Date service for date operations
	 */
	private readonly dateService: DateService =
		inject(DateService);

	/**
	 * Active quick filters
	 */
	readonly activeFilters: WritableSignal<Set<string>> =
		signal(new Set());

	/**
	 * Selected date range
	 */
	readonly selectedDateRange: WritableSignal<string> =
		signal("24h");

	/**
	 * Computed date range icon (memoized for template performance)
	 */
	readonly dateRangeIcon: Signal<string> =
		computed((): string =>
			DataTableUtilities.getDateRangeIcon(this.selectedDateRange()));

	/**
	 * Computed date range label (memoized for template performance)
	 */
	readonly dateRangeLabel: Signal<string> =
		computed((): string =>
			DataTableUtilities.getDateRangeLabel(this.selectedDateRange()));

	/**
	 * Column visibility state
	 */
	private readonly columnVisibility: WritableSignal<Map<string, boolean>> =
		signal(new Map());

	/**
	 * Selection model for bulk actions
	 */
	readonly selection: SelectionModel<T> =
		new SelectionModel<T>(true, []);

	/**
	 * Selection change signal - triggers when selection changes
	 */
	private readonly selectionChange: Signal<readonly T[]> =
		toSignal(
			this.selection.changed.pipe(
				map(
					() =>
						this.selection.selected as readonly T[])),
			{ initialValue: [] as readonly T[] });

	// ========================================
	// Computed Signals
	// ========================================

	/**
	 * Visible columns
	 */
	readonly visibleColumns: Signal<TableColumn<T>[]> =
		computed(
			() =>
			{
				const visibility: Map<string, boolean> =
					this.columnVisibility();
				return this
				.columns()
				.filter(
					(col) =>
					{
						const isVisible: boolean | undefined =
							visibility.get(col.key);
						return isVisible !== undefined ? isVisible : col.visible;
					});
			});

	/**
	 * Displayed column keys for mat-table
	 */
	readonly displayedColumns: Signal<string[]> =
		computed(
			() =>
			{
				const columns: string[] = [];

				// Add select column if selectable
				if (this.selectable())
				{
					columns.push("select");
				}

				// Add visible data columns
				columns.push(
					...this
					.visibleColumns()
					.map(
						(col) => col.key));

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
	readonly hasSelection: Signal<boolean> =
		computed(
			() => this.selectionChange().length > 0);

	/**
	 * Number of selected items
	 */
	readonly selectedCount: Signal<number> =
		computed(
			() => this.selectionChange().length);

	/**
	 * Is all selected
	 */
	readonly isAllSelected: Signal<boolean> =
		computed(
			() =>
			{
				const numSelected: number =
					this.selectionChange().length;
				const numRows: number =
					this.data().length;
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
		effect(
			() => this.initializeFirstQuickFilter());
		effect(
			() => this.emitInitialDateRange());
		effect(
			() => this.loadColumnPreferences());
		effect(
			() => this.clearSelectionOnDataChange());
	}

	/**
	 * Initializes first quick filter as active in single-selection mode.
	 */
	private initializeFirstQuickFilter(): void
	{
		const filters: QuickFilter<T>[] =
			this.quickFilters();
		const singleSelection: boolean =
			this.quickFiltersSingleSelection();
		const currentFilters: Set<string> =
			this.activeFilters();

		// Only initialize if single-selection mode, has filters, and no filter is active yet
		if (
			singleSelection
				&& filters.length > 0
				&& currentFilters.size === 0)
		{
			// Activate the first filter (typically "All")
			const firstFilterKey: string =
				filters[0].key;
			this.activeFilters.set(
				new Set(
					[firstFilterKey]));
			// Emit the initial filter state
			this.filterChange.emit(
				{
					filterKey: firstFilterKey,
					active: true
				});
		}
	}

	/**
	 * Emits initial date range when dateRangeEnabled is set.
	 */
	private emitInitialDateRange(): void
	{
		const enabled: boolean =
			this.dateRangeEnabled();
		if (enabled && !this.initialDateRangeEmitted)
		{
			this.initialDateRangeEmitted = true;
			// Emit the default 24h date range on initialization
			const range: string =
				this.selectedDateRange();
			this.onDateRangeChange(range);
		}
	}

	/**
	 * Loads column preferences from localStorage.
	 */
	private loadColumnPreferences(): void
	{
		const key: string | null =
			this.storageKey();
		if (key)
		{
			const stored: string | null =
				localStorage.getItem(key);
			if (stored)
			{
				const visibility: Map<string, boolean> | null =
					DataTableUtilities.parseColumnPreferences(stored);
				if (visibility)
				{
					this.columnVisibility.set(visibility);
				}
			}
		}
	}

	/**
	 * Clears selection when data changes.
	 */
	private clearSelectionOnDataChange(): void
	{
		this.data();
		this.selection.clear();
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
		const searchText: string =
			this.searchText();
		this.searchChange.emit(searchText);
	}

	/**
	 * Handle sort change from mat-sort
	 * @param sort - Material sort event
	 */
	onSortChange(sort: Sort): void
	{
		this.sortChange.emit(
			{
				sortBy: sort.active,
				sortDescending: sort.direction === "desc"
			});
	}

	/**
	 * Handle filter toggle
	 */
	onFilterToggle(filterKey: string): void
	{
		const result: { filters: Set<string>; active: boolean; } =
			DataTableUtilities.updateFilters(
				this.activeFilters(),
				filterKey,
				this.quickFiltersSingleSelection());

		this.activeFilters.set(result.filters);
		this.filterChange.emit(
			{ filterKey, active: result.active });
	}

	/**
	 * Handle date range change
	 */
	onDateRangeChange(range: string): void
	{
		this.selectedDateRange.set(range);
		const now: Date =
			this.dateService.parseUTC(this.dateService.now());
		const event: DateRangeEvent | null =
			DataTableUtilities.calculateDateRange(range, now);
		if (event)
		{
			this.dateRangeChange.emit(event);
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
		this.rowAction.emit(
			{ action, row });
	}

	/**
	 * Handle bulk action
	 */
	onBulkAction(action: string): void
	{
		this.bulkAction.emit(
			{
				action,
				selectedRows: this.selection.selected,
				selectedIds: this.selection.selected.map(
					(row) => row.id)
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
		const visibility: Map<string, boolean> =
			new Map(this.columnVisibility());
		const currentValue: boolean | undefined =
			visibility.get(columnKey);
		const column: TableColumn<T> | undefined =
			this.columns()
			.find((col) => col.key === columnKey);

		if (column)
		{
			const newValue: boolean =
				currentValue !== undefined ? !currentValue : !column.visible;
			visibility.set(columnKey, newValue);
			this.columnVisibility.set(visibility);

			const key: string | null =
				this.storageKey();
			if (key)
			{
				localStorage.setItem(key, DataTableUtilities.serializeColumnPreferences(visibility));
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
			this
			.data()
			.forEach(
				(row) => this.selection.select(row));
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
		const visibility: Map<string, boolean> =
			this.columnVisibility();
		const column: TableColumn<T> | undefined =
			this
			.columns()
			.find(
				(c: TableColumn<T>): boolean =>
					c.key === key);
		return visibility.get(key) ?? column?.visible ?? true;
	}
}
