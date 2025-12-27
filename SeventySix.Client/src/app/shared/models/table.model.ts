/**
 * Type definitions for generic data table component
 * Provides reusable table infrastructure for feature components
 */

/** Cell value types supported in data tables */
export type CellValue = string | number | boolean | Date | null | undefined;

/**
 * Column definition for data table
 */
export interface TableColumn<T = unknown>
{
	/**
	 * Column property name (matches entity property)
	 * @type {string}
	 */
	key: string;

	/**
	 * Display label for column header
	 * @type {string}
	 */
	label: string;

	/**
	 * Enable sorting for this column
	 * @type {boolean}
	 */
	sortable: boolean;

	/**
	 * Initial visibility state
	 * @type {boolean}
	 */
	visible: boolean;

	/**
	 * Column type for rendering strategy
	 * @type {"text" | "date" | "badge" | "actions" | undefined}
	 */
	type?: "text" | "date" | "badge" | "actions";

	/**
	 * Custom formatter function
	 * @type {(value: CellValue, row?: T) => string | undefined}
	 * @param {CellValue} value
	 * Cell value
	 * @param {T | undefined} row
	 * Optional row context for cross-column formatting
	 */
	formatter?: (value: CellValue, row?: T) => string;

	/**
	 * Badge color function (for type="badge" columns).
	 * @type {(value: CellValue, row?: T) => "primary" | "accent" | "warn" | undefined}
	 * @param {CellValue} value
	 * The cell value to determine badge color for.
	 * @param {T} [row]
	 * Optional row context.
	 */
	badgeColor?: (value: CellValue, row?: T) => "primary" | "accent" | "warn";
}

/**
 * Quick filter definition (chip-based filtering)
 */
export interface QuickFilter<T = unknown>
{
	/**
	 * Filter identifier
	 * @type {string}
	 */
	key: string;

	/**
	 * Display label
	 * @type {string}
	 */
	label: string;

	/**
	 * Material icon name
	 * @type {string | undefined}
	 */
	icon?: string;

	/**
	 * Filter predicate function (optional for server-side filtering)
	 * @type {(item: T) => boolean | undefined}
	 * @param {T} item
	 * Row data
	 * @returns {boolean}
	 * True if item matches filter
	 */
	filterFn?: (item: T) => boolean;
}

/**
 * Per-row action definition
 */
export interface RowAction<T = unknown>
{
	/**
	 * Action identifier (e.g., 'delete', 'edit', 'view')
	 * @type {string}
	 */
	key: string;

	/**
	 * Display label
	 * @type {string}
	 */
	label: string;

	/**
	 * Material icon name
	 * @type {string}
	 */
	icon: string;

	/**
	 * Material color theme
	 * @type {"primary" | "accent" | "warn" | undefined}
	 */
	color?: "primary" | "accent" | "warn";

	/**
	 * Conditional visibility function
	 * @param {T} row
	 * Row data
	 * @returns {boolean}
	 * True if action should be shown
	 */
	showIf?: (row: T) => boolean;
}

/**
 * Bulk action definition
 */
export interface BulkAction
{
	/**
	 * Action identifier (e.g., 'delete-all', 'activate')
	 * @type {string}
	 */
	key: string;

	/**
	 * Display label
	 * @type {string}
	 */
	label: string;

	/**
	 * Material icon name
	 * @type {string}
	 */
	icon: string;

	/**
	 * Material color theme
	 * @type {"primary" | "accent" | "warn" | undefined}
	 */
	color?: "primary" | "accent" | "warn";

	/**
	 * Disabled when no rows selected (default: true)
	 * @type {boolean | undefined}
	 */
	requiresSelection?: boolean;
}

/**
 * Row action event (emitted when per-row action triggered)
 */
export interface RowActionEvent<T = unknown>
{
	/**
	 * Action key
	 * @type {string}
	 */
	action: string;

	/**
	 * Row data
	 * @type {T}
	 */
	row: T;
}

/**
 * Bulk action event (emitted when bulk action triggered)
 */
export interface BulkActionEvent<T = unknown>
{
	/**
	 * Action key
	 * @type {string}
	 */
	action: string;

	/**
	 * Selected row data
	 * @type {T[]}
	 */
	selectedRows: T[];

	/**
	 * Selected row IDs
	 * @type {number[]}
	 */
	selectedIds: number[];
}

/**
 * Filter change event (emitted when quick filter toggled)
 */
export interface FilterChangeEvent
{
	/**
	 * Filter key
	 * @type {string}
	 */
	filterKey: string;

	/**
	 * Filter active state
	 * @type {boolean}
	 */
	active: boolean;
}

/**
 * Date range event (emitted when date range changes)
 */
export interface DateRangeEvent
{
	/**
	 * Start date (undefined for "all")
	 * @type {Date | undefined}
	 */
	startDate?: Date;

	/**
	 * End date (undefined for "all")
	 * @type {Date | undefined}
	 */
	endDate?: Date;

	/**
	 * Preset selection
	 * @type {"24h" | "7d" | "30d" | "all"}
	 */
	preset: "24h" | "7d" | "30d" | "all";
}

/**
 * Sort change event for server-side sorting
 */
export interface SortChangeEvent
{
	/**
	 * Column key to sort by
	 * @type {string}
	 */
	sortBy: string;

	/**
	 * Sort direction (true = descending, false = ascending)
	 * @type {boolean}
	 */
	sortDescending: boolean;
}

/**
 * Options for computing displayed columns in DataTableColumnManager.
 */
export interface DisplayColumnOptions
{
	/**
	 * Whether selection checkbox column should be included.
	 * @type {boolean}
	 */
	selectable: boolean;

	/**
	 * Whether row actions column should be included.
	 * @type {boolean}
	 */
	hasRowActions: boolean;
}
