import {
	computed,
	Signal,
	signal,
	WritableSignal
} from "@angular/core";
import {
	DateRangeEvent,
	FilterChangeEvent,
	QuickFilter
} from "@shared/models";
import { DateService } from "@shared/services";
import { DataTableUtilities } from "@shared/utilities";

/**
 * Configuration for filter manager.
 * @template T
 * The data type being filtered.
 */
export interface FilterManagerConfig<T>
{
	/**
	 * Quick filter definitions.
	 * @type {QuickFilter<T>[]}
	 */
	quickFilters?: QuickFilter<T>[];

	/**
	 * Whether quick filters are in single-selection mode.
	 * @type {boolean}
	 */
	singleSelection?: boolean;

	/**
	 * Whether date range filtering is enabled.
	 * @type {boolean}
	 */
	dateRangeEnabled?: boolean;

	/**
	 * Default date range selection.
	 * @type {string}
	 */
	defaultDateRange?: string;

	/**
	 * Date service for date calculations.
	 * @type {DateService}
	 */
	dateService?: DateService;
}

/**
 * Manages filter state for DataTableComponent.
 *
 * Encapsulates quick filter and date range logic, providing reactive signals
 * for filter state. Handles filter toggle operations and date range calculations.
 *
 * @remarks
 * Uses Angular signals for reactive state management.
 * Follows single responsibility principle (SRP) by handling only filter concerns.
 * @template T
 * The data type being filtered.
 */
export class DataTableFilterManager<T>
{
	/**
	 * Active quick filters by key.
	 * @type {WritableSignal<Set<string>>}
	 * @private
	 * @readonly
	 */
	private readonly activeFiltersState: WritableSignal<Set<string>> =
		signal(new Set());

	/**
	 * Selected date range key.
	 * @type {WritableSignal<string>}
	 * @private
	 * @readonly
	 */
	private readonly selectedDateRangeState: WritableSignal<string>;

	/**
	 * Whether quick filters are in single-selection mode.
	 * @type {boolean}
	 * @private
	 * @readonly
	 */
	private readonly singleSelection: boolean;

	/**
	 * Whether date range filtering is enabled.
	 * @type {boolean}
	 * @readonly
	 */
	readonly dateRangeEnabled: boolean;

	/**
	 * Date service for date calculations.
	 * @type {DateService | undefined}
	 * @private
	 * @readonly
	 */
	private readonly dateService?: DateService;

	/**
	 * Quick filter definitions.
	 * @type {QuickFilter<T>[]}
	 * @readonly
	 */
	readonly quickFilters: QuickFilter<T>[];

	/**
	 * Creates a new DataTableFilterManager.
	 * @param {FilterManagerConfig<T>} config
	 * Configuration for filter behavior.
	 */
	constructor(config?: FilterManagerConfig<T>)
	{
		this.quickFilters =
			config?.quickFilters ?? [];
		this.singleSelection =
			config?.singleSelection ?? false;
		this.dateRangeEnabled =
			config?.dateRangeEnabled ?? false;
		this.dateService =
			config?.dateService;
		this.selectedDateRangeState =
			signal(config?.defaultDateRange ?? "24h");
	}

	/**
	 * Active filters as a reactive signal.
	 * @type {Signal<Set<string>>}
	 * @readonly
	 */
	readonly activeFilters: Signal<Set<string>> =
		computed(
			() => this.activeFiltersState());

	/**
	 * Selected date range key as a reactive signal.
	 * @type {Signal<string>}
	 * @readonly
	 */
	readonly selectedDateRange: Signal<string> =
		computed(
			() => this.selectedDateRangeState());

	/**
	 * Computed date range icon based on current selection.
	 * @type {Signal<string>}
	 * @readonly
	 */
	readonly dateRangeIcon: Signal<string> =
		computed(
			() =>
				DataTableUtilities.getDateRangeIcon(
					this.selectedDateRangeState()));

	/**
	 * Computed date range label based on current selection.
	 * @type {Signal<string>}
	 * @readonly
	 */
	readonly dateRangeLabel: Signal<string> =
		computed(
			() =>
				DataTableUtilities.getDateRangeLabel(
					this.selectedDateRangeState()));

	/**
	 * Toggles a quick filter and returns the change event.
	 * @param {string} filterKey
	 * The filter key to toggle.
	 * @returns {FilterChangeEvent}
	 * Event containing the filter key and new active state.
	 */
	toggleFilter(filterKey: string): FilterChangeEvent
	{
		const result: { filters: Set<string>; active: boolean; } =
			DataTableUtilities.updateFilters(
				this.activeFiltersState(),
				filterKey,
				this.singleSelection);

		this.activeFiltersState.set(result.filters);
		return { filterKey, active: result.active };
	}

	/**
	 * Sets a specific filter as active (useful for initial state).
	 * @param {string} filterKey
	 * The filter key to activate.
	 * @returns {void}
	 */
	activateFilter(filterKey: string): void
	{
		const currentFilters: Set<string> =
			this.activeFiltersState();

		if (this.singleSelection)
		{
			this.activeFiltersState.set(
				new Set(
					[filterKey]));
		}
		else
		{
			const newFilters: Set<string> =
				new Set(currentFilters);
			newFilters.add(filterKey);
			this.activeFiltersState.set(
				newFilters);
		}
	}

	/**
	 * Checks if a specific filter is active.
	 * @param {string} filterKey
	 * The filter key to check.
	 * @returns {boolean}
	 * True if the filter is active.
	 */
	isFilterActive(filterKey: string): boolean
	{
		return this
			.activeFiltersState()
			.has(filterKey);
	}

	/**
	 * Changes the date range and calculates the date range event.
	 * @param {string} range
	 * The new date range key (e.g., '24h', '7d').
	 * @returns {DateRangeEvent | null}
	 * The calculated date range event, or null if date service is not provided.
	 */
	changeDateRange(range: string): DateRangeEvent | null
	{
		this.selectedDateRangeState.set(range);

		if (!this.dateService)
		{
			return null;
		}

		const now: Date =
			this.dateService.parseUTC(this.dateService.now());
		return DataTableUtilities.calculateDateRange(
			range,
			now,
			this.dateService);
	}

	/**
	 * Clears all active filters.
	 * @returns {void}
	 */
	clearFilters(): void
	{
		this.activeFiltersState.set(new Set());
	}

	/**
	 * Initializes the first quick filter as active (for single-selection mode).
	 * @returns {FilterChangeEvent | null}
	 * The initial filter event, or null if already initialized or no filters.
	 */
	initializeFirstFilter(): FilterChangeEvent | null
	{
		if (
			!this.singleSelection
				|| this.quickFilters.length === 0
				|| this.activeFiltersState().size > 0)
		{
			return null;
		}

		const firstFilterKey: string =
			this.quickFilters[0].key;
		this.activeFiltersState.set(
			new Set(
				[firstFilterKey]));
		return { filterKey: firstFilterKey, active: true };
	}
}
