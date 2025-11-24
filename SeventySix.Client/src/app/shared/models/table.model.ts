/**
 * Type definitions for generic data table component
 * Provides reusable table infrastructure for feature components
 */

/**
 * Column definition for data table
 */
export interface TableColumn<T = unknown>
{
	/**
	 * Column property name (matches entity property)
	 */
	key: string;

	/**
	 * Display label for column header
	 */
	label: string;

	/**
	 * Enable sorting for this column
	 */
	sortable: boolean;

	/**
	 * Initial visibility state
	 */
	visible: boolean;

	/**
	 * Column type for rendering strategy
	 */
	type?: "text" | "date" | "badge" | "actions";

	/**
	 * Custom formatter function
	 * @param value - Cell value
	 * @param row - Optional row context for cross-column formatting
	 */
	formatter?: (value: unknown, row?: T) => string;

	/**
	 * Badge color function (for type="badge" columns)
	 * @param value - Cell value
	 * @param row - Optional row context
	 */
	badgeColor?: (value: unknown, row?: T) => "primary" | "accent" | "warn";
}

/**
 * Quick filter definition (chip-based filtering)
 */
export interface QuickFilter<T = unknown>
{
	/**
	 * Filter identifier
	 */
	key: string;

	/**
	 * Display label
	 */
	label: string;

	/**
	 * Material icon name
	 */
	icon?: string;

	/**
	 * Filter predicate function (optional for server-side filtering)
	 * @param item - Row data
	 * @returns true if item matches filter
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
	 */
	key: string;

	/**
	 * Display label
	 */
	label: string;

	/**
	 * Material icon name
	 */
	icon: string;

	/**
	 * Material color theme
	 */
	color?: "primary" | "accent" | "warn";

	/**
	 * Conditional visibility function
	 * @param row - Row data
	 * @returns true if action should be shown
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
	 */
	key: string;

	/**
	 * Display label
	 */
	label: string;

	/**
	 * Material icon name
	 */
	icon: string;

	/**
	 * Material color theme
	 */
	color?: "primary" | "accent" | "warn";

	/**
	 * Disabled when no rows selected (default: true)
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
	 */
	action: string;

	/**
	 * Row data
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
	 */
	action: string;

	/**
	 * Selected row data
	 */
	selectedRows: T[];

	/**
	 * Selected row IDs
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
	 */
	filterKey: string;

	/**
	 * Filter active state
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
	 */
	startDate?: Date;

	/**
	 * End date (undefined for "all")
	 */
	endDate?: Date;

	/**
	 * Preset selection
	 */
	preset: "24h" | "7d" | "30d" | "all";
}
