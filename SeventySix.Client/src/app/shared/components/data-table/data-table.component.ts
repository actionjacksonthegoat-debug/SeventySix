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
import { FormsModule } from "@angular/forms";
import { MatCard, MatCardContent } from "@angular/material/card";
import { PageEvent } from "@angular/material/paginator";
import { Sort } from "@angular/material/sort";
import { environment } from "@environments/environment";
import { slideDown } from "@shared/animations/animations";
import {
	DataTableColumnManager,
	DataTableSelectionManager
} from "@shared/components/data-table/managers";
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
	/**
	 * Skeleton theme for table cell placeholders.
	 * @type {SkeletonTheme}
	 */
	readonly skeletonTableCell: SkeletonTheme = SKELETON_TABLE_CELL;

	/**
	 * Skeleton theme for checkbox placeholder.
	 * @type {SkeletonTheme}
	 */
	readonly skeletonCheckbox: SkeletonTheme = SKELETON_CHECKBOX;

	/**
	 * Skeleton theme for icon-button placeholder.
	 * @type {SkeletonTheme}
	 */
	readonly skeletonIconButton: SkeletonTheme =
		SKELETON_ICON_BUTTON;

	/**
	 * Skeleton placeholder ID - must be negative to trigger skeleton rendering.
	 * @type {number}
	 * @private
	 */
	private static readonly SKELETON_ROW_ID: number = -1;

	/**
	 * Table data source - shows skeleton placeholder row when loading.
	 * @type {Signal<T[]>}
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

	/**
	 * Column definitions.
	 * @type {InputSignal<TableColumn<T>[]>}
	 */
	readonly columns: InputSignal<TableColumn<T>[]> =
		input.required<TableColumn<T>[]>();

	/**
	 * Table data (current page items).
	 * @type {InputSignal<T[]>}
	 */
	readonly data: InputSignal<T[]> =
		input.required<T[]>();

	/**
	 * Loading state.
	 * @type {InputSignal<boolean>}
	 */
	readonly isLoading: InputSignal<boolean> =
		input.required<boolean>();

	/**
	 * Total items across all pages.
	 * @type {InputSignal<number>}
	 */
	readonly totalCount: InputSignal<number> =
		input.required<number>();

	/**
	 * Current page (0-based).
	 * @type {InputSignal<number>}
	 */
	readonly pageIndex: InputSignal<number> =
		input.required<number>();

	/**
	 * Items per page.
	 * @type {InputSignal<number>}
	 */
	readonly pageSize: InputSignal<number> =
		input.required<number>();

	// ===== Optional Inputs =====

	/**
	 * Error message to display when table encounters an error.
	 * @type {InputSignal<string | null>}
	 */
	readonly error: InputSignal<string | null> =
		input<string | null>(null);

	/**
	 * Enable search.
	 * @type {InputSignal<boolean>}
	 */
	readonly searchable: InputSignal<boolean> =
		input<boolean>(true);

	/**
	 * Enable bulk selection (checkbox column).
	 * @type {InputSignal<boolean>}
	 */
	readonly selectable: InputSignal<boolean> =
		input<boolean>(false);

	/**
	 * Show "Select All" checkbox in header.
	 * @type {InputSignal<boolean>}
	 */
	readonly showSelectAll: InputSignal<boolean> =
		input<boolean>(false);

	/**
	 * Show create button.
	 * @type {InputSignal<boolean>}
	 */
	readonly showCreate: InputSignal<boolean> =
		input<boolean>(false);

	/**
	 * Show refresh button.
	 * @type {InputSignal<boolean>}
	 */
	readonly showRefresh: InputSignal<boolean> =
		input<boolean>(true);

	/**
	 * Quick filters (status/level chips).
	 * @type {InputSignal<QuickFilter<T>[]>}
	 */
	readonly quickFilters: InputSignal<QuickFilter<T>[]> =
		input<
			QuickFilter<T>[]>([]);

	/**
	 * Single-selection mode for quick filters.
	 * When true, only one filter can be active at a time.
	 * @type {InputSignal<boolean>}
	 */
	readonly quickFiltersSingleSelection: InputSignal<boolean> =
		input<boolean>(false);

	/**
	 * Enable date range filter.
	 * @type {InputSignal<boolean>}
	 */
	readonly dateRangeEnabled: InputSignal<boolean> =
		input<boolean>(false);

	/**
	 * Page size options.
	 * @type {InputSignal<number[]>}
	 */
	readonly pageSizeOptions: InputSignal<number[]> =
		input<number[]>(
			[
				25,
				50,
				100
			]);

	/**
	 * Virtual scroll item size (from environment config).
	 * @type {InputSignal<number>}
	 */
	readonly virtualScrollItemSize: InputSignal<number> =
		input<number>(
			environment.ui.tables.virtualScrollItemSize);

	/**
	 * localStorage key for column preferences.
	 * @type {InputSignal<string | null>}
	 */
	readonly storageKey: InputSignal<string | null> =
		input<string | null>(
			null);

	/**
	 * Per-row action menu items.
	 * @type {InputSignal<RowAction<T>[]>}
	 */
	readonly rowActions: InputSignal<RowAction<T>[]> =
		input<RowAction<T>[]>(
			[]);

	/**
	 * Bulk action menu items (shown when rows selected).
	 * @type {InputSignal<BulkAction[]>}
	 */
	readonly bulkActions: InputSignal<BulkAction[]> =
		input<BulkAction[]>([]);

	// ========================================
	// Outputs
	// ========================================

	/**
	 * Row clicked.
	 * @type {OutputEmitterRef<T>}
	 */
	readonly rowClick: OutputEmitterRef<T> =
		output<T>();

	/**
	 * Create button clicked.
	 * @type {OutputEmitterRef<void>}
	 */
	readonly createClick: OutputEmitterRef<void> =
		output<void>();

	/**
	 * Refresh button clicked.
	 * @type {OutputEmitterRef<void>}
	 */
	readonly refreshClick: OutputEmitterRef<void> =
		output<void>();

	/**
	 * Per-row action triggered.
	 * @type {OutputEmitterRef<RowActionEvent<T>>}
	 */
	readonly rowAction: OutputEmitterRef<RowActionEvent<T>> =
		output<RowActionEvent<T>>();

	/**
	 * Bulk action triggered.
	 * @type {OutputEmitterRef<BulkActionEvent<T>>}
	 */
	readonly bulkAction: OutputEmitterRef<BulkActionEvent<T>> =
		output<BulkActionEvent<T>>();

	/**
	 * Search text changed (debounced).
	 * @type {OutputEmitterRef<string>}
	 */
	readonly searchChange: OutputEmitterRef<string> =
		output<string>();

	/**
	 * Quick filter changed.
	 * @type {OutputEmitterRef<FilterChangeEvent>}
	 */
	readonly filterChange: OutputEmitterRef<FilterChangeEvent> =
		output<FilterChangeEvent>();

	/**
	 * Date range changed.
	 * @type {OutputEmitterRef<DateRangeEvent>}
	 */
	readonly dateRangeChange: OutputEmitterRef<DateRangeEvent> =
		output<DateRangeEvent>();

	/**
	 * Page changed (0-based index).
	 * @type {OutputEmitterRef<number>}
	 */
	readonly pageChange: OutputEmitterRef<number> =
		output<number>();

	/**
	 * Page size changed.
	 * @type {OutputEmitterRef<number>}
	 */
	readonly pageSizeChange: OutputEmitterRef<number> =
		output<number>();

	/**
	 * Sort column/direction changed.
	 * @type {OutputEmitterRef<SortChangeEvent>}
	 */
	readonly sortChange: OutputEmitterRef<SortChangeEvent> =
		output<SortChangeEvent>();

	// ========================================
	// Internal State
	// ========================================

	/**
	 * Search text (debounced)
	 * @type {WritableSignal<string>}
	 */
	readonly searchText: WritableSignal<string> =
		signal("");

	/**
	 * Date service for date operations.
	 * @type {DateService}
	 * @private
	 * @readonly
	 */
	private readonly dateService: DateService =
		inject(DateService);

	/**
	 * Active quick filters.
	 * @type {WritableSignal<Set<string>>}
	 */
	readonly activeFilters: WritableSignal<Set<string>> =
		signal(new Set());

	/**
	 * Selected date range.
	 * @type {WritableSignal<string>}
	 */
	readonly selectedDateRange: WritableSignal<string> =
		signal("24h");

	/**
	 * Computed date range icon (memoized for template performance).
	 * @type {Signal<string>}
	 */
	readonly dateRangeIcon: Signal<string> =
		computed((): string =>
			DataTableUtilities.getDateRangeIcon(this.selectedDateRange()));

	/**
	 * Computed date range label (memoized for template performance).
	 * @type {Signal<string>}
	 */
	readonly dateRangeLabel: Signal<string> =
		computed((): string =>
			DataTableUtilities.getDateRangeLabel(this.selectedDateRange()));

	/**
	 * Column manager for visibility and persistence.
	 * @type {DataTableColumnManager<T>}
	 * @private
	 * @readonly
	 */
	private readonly columnManager: DataTableColumnManager<T> =
		new DataTableColumnManager<T>(this.columns);

	/**
	 * Selection manager for row selection state.
	 * @type {DataTableSelectionManager<T>}
	 * @readonly
	 */
	readonly selectionManager: DataTableSelectionManager<T> =
		new DataTableSelectionManager<T>();

	// ========================================
	// Computed Signals (delegated to managers)
	// ========================================

	/**
	 * Visible columns (delegated to column manager).
	 * @type {Signal<TableColumn<T>[]>}
	 */
	readonly visibleColumns: Signal<TableColumn<T>[]> =
		this.columnManager.visibleColumns;

	/**
	 * Displayed column keys for mat-table.
	 * @type {Signal<string[]>}
	 */
	readonly displayedColumns: Signal<string[]> =
		computed(
			() =>
				this.columnManager.getDisplayedColumns(
					{
						selectable: this.selectable(),
						hasRowActions: this.rowActions().length > 0
					}));

	/**
	 * Has selection (delegated to selection manager).
	 * @type {Signal<boolean>}
	 */
	readonly hasSelection: Signal<boolean> =
		this.selectionManager.hasSelection;

	/**
	 * Number of selected items (delegated to selection manager).
	 * @type {Signal<number>}
	 */
	readonly selectedCount: Signal<number> =
		this.selectionManager.selectedCount;

	/**
	 * Is all selected.
	 * @type {Signal<boolean>}
	 */
	readonly isAllSelected: Signal<boolean> =
		computed(
			() =>
				this.selectionManager.isAllSelected(this.data().length));

	// ========================================
	// Constructor & Lifecycle
	// ========================================

	/**
	 * Track whether initial date range has been emitted.
	 * @type {boolean}
	 * @private
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
	 * @returns {void}
	 * @private
	 */
	private loadColumnPreferences(): void
	{
		this.columnManager.loadPreferences(this.storageKey());
	}

	/**
	 * Clears selection when data changes.
	 * @returns {void}
	 * @private
	 */
	private clearSelectionOnDataChange(): void
	{
		this.data();
		this.selectionManager.clear();
	}

	// ========================================
	// Event Handlers
	// ========================================

	/**
	 * Handle search input change.
	 *
	 * @param {string} searchText
	 * The new search text entered by the user.
	 * @returns {void}
	 */
	onSearchChange(searchText: string): void
	{
		this.searchText.set(searchText);
	}

	/**
	 * Execute search (Enter key or search button click).
	 *
	 * @returns {void}
	 */
	onSearch(): void
	{
		const searchText: string =
			this.searchText();
		this.searchChange.emit(searchText);
	}

	/**
	 * Handle sort change from mat-sort.
	 *
	 * @param {Sort} sort
	 * The Material sort event.
	 * @returns {void}
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
	 * Handle filter toggle.
	 *
	 * @param {string} filterKey
	 * The filter key being toggled.
	 * @returns {void}
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
	 * Handle date range change.
	 *
	 * @param {string} range
	 * The selected date range key (e.g., '24h', '7d').
	 * @returns {void}
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
	 * Handle row click.
	 *
	 * @param {T} row
	 * The clicked row item.
	 * @returns {void}
	 */
	onRowClick(row: T): void
	{
		this.rowClick.emit(row);
	}

	/**
	 * Handle row action.
	 *
	 * @param {string} action
	 * Action identifier triggered from the row menu.
	 * @param {T} row
	 * The row item the action applies to.
	 * @returns {void}
	 */
	onRowAction(action: string, row: T): void
	{
		this.rowAction.emit(
			{ action, row });
	}

	/**
	 * Handle bulk action.
	 *
	 * @param {string} action
	 * Identifier of the bulk action triggered (e.g., 'delete').
	 * @returns {void}
	 */
	onBulkAction(action: string): void
	{
		const selectedRows: readonly T[] =
			this.selectionManager.selected();
		this.bulkAction.emit(
			{
				action,
				selectedRows: [...selectedRows],
				selectedIds: selectedRows.map(
					(row: T) => row.id)
			});
	}

	/**
	 * Handle page change.
	 *
	 * @param {PageEvent} event
	 * The paginator page event.
	 * @returns {void}
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
	 * Handle create button.
	 * @returns {void}
	 */
	onCreate(): void
	{
		this.createClick.emit();
	}

	/**
	 * Handle refresh button.
	 * @returns {void}
	 */
	onRefresh(): void
	{
		this.refreshClick.emit();
	}

	/**
	 * Toggle column visibility.
	 *
	 * @param {string} columnKey
	 * The key of the column to toggle visibility for.
	 * @returns {void}
	 */
	toggleColumn(columnKey: string): void
	{
		this.columnManager.toggleColumn(columnKey);
		this.columnManager.savePreferences(this.storageKey());
	}

	/**
	 * Toggle all rows selection.
	 * @returns {void}
	 */
	toggleAllRows(): void
	{
		this.selectionManager.toggleAll(this.data());
	}

	/**
	 * Check if action should be shown for row.
	 *
	 * @param {RowAction<T>} action
	 * The row action to evaluate.
	 * @param {T} row
	 * The row item to test the action against.
	 * @returns {boolean}
	 * True when the action should be displayed for the row.
	 */
	shouldShowAction(action: RowAction<T>, row: T): boolean
	{
		return action.showIf ? action.showIf(row) : true;
	}

	/**
	 * Check if a column is currently visible.
	 *
	 * @param {string} columnKey
	 * Column key to check.
	 * @returns {boolean}
	 * True if column is visible.
	 */
	protected columnVisible(columnKey: string): boolean
	{
		return this.columnManager.isColumnVisible(columnKey);
	}
}
