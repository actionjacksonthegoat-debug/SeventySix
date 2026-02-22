import { computed, Signal, signal, WritableSignal } from "@angular/core";
import { DisplayColumnOptions, TableColumn } from "@shared/models";
import { DataTableUtilities } from "@shared/utilities";
import { isNullOrEmpty, isPresent } from "@shared/utilities/null-check.utility";

/**
 * Manages column visibility state for DataTableComponent.
 *
 * Handles column visibility state, localStorage persistence,
 * and computes visible/displayed columns for the mat-table.
 *
 * @remarks
 * Uses Angular signals for reactive state management.
 * Persists column preferences to localStorage when a storageKey is provided.
 */
export class DataTableColumnManager<T>
{
	/**
	 * Column visibility override state.
	 * Keys are column keys, values indicate visibility (true = visible).
	 * @type {WritableSignal<Map<string, boolean>>}
	 * @private
	 * @readonly
	 */
	private readonly columnVisibility: WritableSignal<Map<string, boolean>> =
		signal(new Map());

	/**
	 * Reference to the columns signal from the parent component.
	 * @type {Signal<TableColumn<T>[]>}
	 * @private
	 * @readonly
	 */
	private readonly columns: Signal<TableColumn<T>[]>;

	/**
	 * Computed signal of visible columns based on definitions and overrides.
	 * @type {Signal<TableColumn<T>[]>}
	 * @readonly
	 */
	readonly visibleColumns: Signal<TableColumn<T>[]>;

	/**
	 * Creates a new DataTableColumnManager.
	 * @param {Signal<TableColumn<T>[]>} columns
	 * Signal containing the column definitions from the parent component.
	 */
	constructor(columns: Signal<TableColumn<T>[]>)
	{
		this.columns = columns;

		this.visibleColumns =
			computed(
				() =>
				{
					const visibility: Map<string, boolean> =
						this.columnVisibility();
					return this
						.columns()
						.filter(
							(column: TableColumn<T>) =>
							{
								const isVisible: boolean | undefined =
									visibility.get(column.key);
								return isVisible !== undefined
									? isVisible
									: column.visible;
							});
				});
	}

	/**
	 * Computes displayed column keys including optional select/actions columns.
	 * @param {DisplayColumnOptions} options
	 * Configuration for which special columns to include.
	 * @returns {string[]}
	 * Array of column keys for mat-table displayedColumns binding.
	 */
	getDisplayedColumns(options: DisplayColumnOptions): string[]
	{
		const columns: string[] = [];

		if (options.selectable)
		{
			columns.push("select");
		}

		columns.push(
			...this
				.visibleColumns()
				.map(
					(column: TableColumn<T>) => column.key));

		if (options.hasRowActions)
		{
			columns.push("actions");
		}

		return columns;
	}

	/**
	 * Checks if a column is currently visible.
	 * @param {string} columnKey
	 * The key of the column to check.
	 * @returns {boolean}
	 * True if the column is visible, false otherwise.
	 */
	isColumnVisible(columnKey: string): boolean
	{
		const visibility: Map<string, boolean> =
			this.columnVisibility();
		const column: TableColumn<T> | undefined =
			this
				.columns()
				.find(
					(col: TableColumn<T>): boolean =>
						col.key === columnKey);

		return visibility.get(columnKey) ?? column?.visible ?? true;
	}

	/**
	 * Toggles visibility for a specific column.
	 * @param {string} columnKey
	 * The key of the column to toggle.
	 * @returns {void}
	 */
	toggleColumn(columnKey: string): void
	{
		const visibility: Map<string, boolean> =
			new Map(this.columnVisibility());
		const currentValue: boolean | undefined =
			visibility.get(columnKey);
		const column: TableColumn<T> | undefined =
			this
				.columns()
				.find(
					(col: TableColumn<T>) =>
						col.key === columnKey);

		if (column)
		{
			const newValue: boolean =
				currentValue !== undefined
					? !currentValue
					: !column.visible;
			visibility.set(columnKey, newValue);
			this.columnVisibility.set(visibility);
		}
	}

	/**
	 * Loads column preferences from localStorage.
	 * @param {string | null} storageKey
	 * The localStorage key to load from, or null to skip.
	 * @returns {void}
	 */
	loadPreferences(storageKey: string | null): void
	{
		if (isNullOrEmpty(storageKey))
		{
			return;
		}

		const stored: string | null =
			localStorage.getItem(storageKey);

		if (isPresent(stored))
		{
			const visibility: Map<string, boolean> | null =
				DataTableUtilities.parseColumnPreferences(stored);
			if (isPresent(visibility))
			{
				this.columnVisibility.set(visibility);
			}
		}
	}

	/**
	 * Saves current column preferences to localStorage.
	 * @param {string | null} storageKey
	 * The localStorage key to save to, or null to skip.
	 * @returns {void}
	 */
	savePreferences(storageKey: string | null): void
	{
		if (isNullOrEmpty(storageKey))
		{
			return;
		}

		const serialized: string =
			DataTableUtilities.serializeColumnPreferences(this.columnVisibility());
		localStorage.setItem(storageKey, serialized);
	}
}