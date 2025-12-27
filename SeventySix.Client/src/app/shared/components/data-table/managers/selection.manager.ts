import { SelectionModel } from "@angular/cdk/collections";
import { computed, signal, Signal, WritableSignal } from "@angular/core";

/**
 * Manages row selection state for DataTableComponent.
 *
 * Encapsulates CDK SelectionModel integration and exposes reactive
 * signals for selection state. Handles bulk selection operations.
 *
 * @remarks
 * Uses Angular signals for reactive state management.
 * The underlying SelectionModel supports multi-select by default.
 */
export class DataTableSelectionManager<T extends { id: number; }>
{
	/**
	 * CDK SelectionModel for managing row selection state.
	 * @type {SelectionModel<T>}
	 * @readonly
	 */
	readonly selection: SelectionModel<T>;

	/**
	 * Signal tracking selection changes from the SelectionModel.
	 * @type {WritableSignal<readonly T[]>}
	 * @private
	 * @readonly
	 */
	private readonly selectionState: WritableSignal<readonly T[]> =
		signal<readonly T[]>([]);

	/**
	 * Initializes the selection manager with a CDK SelectionModel.
	 * Subscribes to selection changes to keep signals in sync.
	 */
	constructor()
	{
		this.selection =
			new SelectionModel<T>(true, []);

		this.selection.changed.subscribe(
			() =>
			{
				this.selectionState.set(
					this.selection.selected as readonly T[]);
			});
	}

	/**
	 * Currently selected rows as a reactive signal.
	 * @type {Signal<readonly T[]>}
	 * @readonly
	 */
	readonly selected: Signal<readonly T[]> =
		computed(
			() => this.selectionState());

	/**
	 * Whether any rows are currently selected.
	 * @type {Signal<boolean>}
	 * @readonly
	 */
	readonly hasSelection: Signal<boolean> =
		computed(
			() => this.selectionState().length > 0);

	/**
	 * Count of currently selected rows.
	 * @type {Signal<number>}
	 * @readonly
	 */
	readonly selectedCount: Signal<number> =
		computed(
			() => this.selectionState().length);

	/**
	 * Checks if all rows in the data set are selected.
	 * @param {number} dataLength
	 * Total number of rows in the current data set.
	 * @returns {boolean}
	 * True when all rows are selected and data is non-empty.
	 */
	isAllSelected(dataLength: number): boolean
	{
		const selectedLength: number =
			this.selectionState().length;
		return selectedLength === dataLength && dataLength > 0;
	}

	/**
	 * Toggles between select-all and clear-all states.
	 * @param {T[]} data
	 * The data array to select from or clear.
	 * @returns {void}
	 */
	toggleAll(data: T[]): void
	{
		if (this.isAllSelected(data.length))
		{
			this.selection.clear();
		}
		else
		{
			data.forEach(
				(row: T) => this.selection.select(row));
		}
	}

	/**
	 * Clears all current selections.
	 * @returns {void}
	 */
	clear(): void
	{
		this.selection.clear();
	}
}
