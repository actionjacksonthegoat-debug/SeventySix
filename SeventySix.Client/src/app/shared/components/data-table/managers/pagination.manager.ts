import {
	computed,
	Signal,
	signal,
	WritableSignal
} from "@angular/core";
import { PageEvent } from "@angular/material/paginator";

/**
 * Configuration for pagination manager.
 */
export interface PaginationConfig
{
	/**
	 * Initial page index (0-based).
	 * @type {number}
	 */
	initialPageIndex?: number;

	/**
	 * Initial page size.
	 * @type {number}
	 */
	initialPageSize?: number;

	/**
	 * Available page size options.
	 * @type {number[]}
	 */
	pageSizeOptions?: number[];
}

/**
 * Default pagination configuration.
 */
const DEFAULT_CONFIG: Required<PaginationConfig> =
	{
		initialPageIndex: 0,
		initialPageSize: 50,
		pageSizeOptions: [25, 50, 100]
	};

/**
 * Manages pagination state for DataTableComponent.
 *
 * Encapsulates page navigation logic and provides reactive signals
 * for current page state. Handles page changes and validation.
 *
 * @remarks
 * Uses Angular signals for reactive state management.
 * Follows single responsibility principle (SRP) by handling only pagination concerns.
 */
export class DataTablePaginationManager
{
	/**
	 * Current page index (0-based).
	 * @type {WritableSignal<number>}
	 * @private
	 * @readonly
	 */
	private readonly pageIndexState: WritableSignal<number>;

	/**
	 * Current page size.
	 * @type {WritableSignal<number>}
	 * @private
	 * @readonly
	 */
	private readonly pageSizeState: WritableSignal<number>;

	/**
	 * Available page size options.
	 * @type {ReadonlyArray<number>}
	 * @readonly
	 */
	readonly pageSizeOptions: ReadonlyArray<number>;

	/**
	 * Creates a new DataTablePaginationManager.
	 * @param {PaginationConfig} config
	 * Optional configuration for initial pagination state.
	 */
	constructor(config?: PaginationConfig)
	{
		const mergedConfig: Required<PaginationConfig> =
			{ ...DEFAULT_CONFIG, ...config };

		this.pageIndexState =
			signal(mergedConfig.initialPageIndex);
		this.pageSizeState =
			signal(mergedConfig.initialPageSize);
		this.pageSizeOptions =
			mergedConfig.pageSizeOptions;
	}

	/**
	 * Current page index (0-based) as a reactive signal.
	 * @type {Signal<number>}
	 * @readonly
	 */
	readonly pageIndex: Signal<number> =
		computed(
			() => this.pageIndexState());

	/**
	 * Current page size as a reactive signal.
	 * @type {Signal<number>}
	 * @readonly
	 */
	readonly pageSize: Signal<number> =
		computed(
			() => this.pageSizeState());

	/**
	 * Handles page change events from the paginator.
	 * @param {PageEvent} event
	 * The Material paginator page event.
	 * @returns {{ pageChanged: boolean; sizeChanged: boolean; }}
	 * Object indicating which properties changed.
	 */
	handlePageChange(event: PageEvent): { pageChanged: boolean; sizeChanged: boolean; }
	{
		const pageChanged: boolean =
			event.pageIndex !== this.pageIndexState();
		const sizeChanged: boolean =
			event.pageSize !== this.pageSizeState();

		if (pageChanged)
		{
			this.pageIndexState.set(event.pageIndex);
		}

		if (sizeChanged)
		{
			this.pageSizeState.set(event.pageSize);
			// Reset to first page when page size changes
			this.pageIndexState.set(0);
		}

		return { pageChanged, sizeChanged };
	}

	/**
	 * Sets the page index directly.
	 * @param {number} pageIndex
	 * The new page index (0-based).
	 * @returns {void}
	 */
	setPageIndex(pageIndex: number): void
	{
		if (pageIndex >= 0)
		{
			this.pageIndexState.set(pageIndex);
		}
	}

	/**
	 * Sets the page size directly.
	 * @param {number} pageSize
	 * The new page size.
	 * @returns {void}
	 */
	setPageSize(pageSize: number): void
	{
		if (pageSize > 0)
		{
			this.pageSizeState.set(pageSize);
		}
	}

	/**
	 * Resets pagination to first page.
	 * @returns {void}
	 */
	resetToFirstPage(): void
	{
		this.pageIndexState.set(0);
	}
}
