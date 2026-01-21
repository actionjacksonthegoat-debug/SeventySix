import { SelectionModel } from "@angular/cdk/collections";
import {
	computed,
	DestroyRef,
	Signal,
	signal,
	WritableSignal
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

/**
 * Manages row selection state for DataTableComponent.
 *
 * Encapsulates CDK SelectionModel integration and exposes reactive
 * signals for selection state. Handles bulk selection operations.
 *
 * @remarks
 * Uses Angular signals for reactive state management.
 * The underlying SelectionModel supports multi-select by default.
 * Requires DestroyRef from parent component to prevent memory leaks.
 */
export class DataTableSelectionManager<TRow extends { id: number; }>
{
	/**
	 * CDK SelectionModel for managing row selection state.
	 * @type {SelectionModel<TRow>}
	 * @readonly
	 */
	readonly selection: SelectionModel<TRow>;

	/**
	 * Signal tracking selection changes from the SelectionModel.
	 * @type {WritableSignal<readonly TRow[]>}
	 * @private
	 * @readonly
	 */
	private readonly selectionState: WritableSignal<readonly TRow[]> =
		signal<readonly TRow[]>([]);

	/**
	 * Initializes the selection manager with a CDK SelectionModel.
	 * Subscribes to selection changes to keep signals in sync.
	 * Uses takeUntilDestroyed to prevent memory leaks.
	 * @param {DestroyRef} destroyRef
	 * Angular destroy reference from parent component for cleanup.
	 */
	constructor(destroyRef: DestroyRef)
	{
		this.selection =
			new SelectionModel<TRow>(true, []);

		// Subscribe with automatic cleanup on component destroy
		this
		.selection
		.changed
		.pipe(takeUntilDestroyed(destroyRef))
		.subscribe(
			() =>
			{
				this.selectionState.set(
					this.selection.selected as readonly TRow[]);
			});
	}

	/**
	 * Currently selected rows as a reactive signal.
	 * @type {Signal<readonly TRow[]>}
	 * @readonly
	 */
	readonly selected: Signal<readonly TRow[]> =
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
	 * @param {TRow[]} data
	 * The data array to select from or clear.
	 * @returns {void}
	 */
	toggleAll(data: TRow[]): void
	{
		if (this.isAllSelected(data.length))
		{
			this.selection.clear();
		}
		else
		{
			data.forEach(
				(row: TRow) =>
					this.selection.select(row));
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
