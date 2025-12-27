import { HttpContext } from "@angular/common/http";
import { signal, WritableSignal } from "@angular/core";
import { FORCE_REFRESH } from "@shared/interceptors/cache-bypass.interceptor";
import { BaseQueryRequest } from "@shared/models";

/**
 * Base class for filter state management in paginated data tables.
 * Provides common filter operations for features using server-side pagination.
 * Includes force refresh functionality to bypass cache when needed.
 * @template TFilter - Filter type extending BaseQueryRequest
 */
export abstract class BaseFilterService<TFilter extends BaseQueryRequest>
{
	/**
	 * Filter state signal. Protected to allow subclass access while maintaining encapsulation.
	 * @type {WritableSignal<TFilter>}
	 * @protected
	 * @readonly
	 */
	protected readonly filter: WritableSignal<TFilter>;

	/**
	 * Initial filter state for reset functionality (DRY principle).
	 * @type {TFilter}
	 * @private
	 * @readonly
	 */
	private readonly initialFilter: TFilter;

	/**
	 * Force refresh trigger - toggle to bypass cache on next query.
	 * @type {WritableSignal<boolean>}
	 * @protected
	 * @readonly
	 */
	protected readonly forceRefreshTrigger: WritableSignal<boolean> =
		signal<boolean>(false);

	/**
	 * Initialize filter with default values and store for reset.
	 * @param {TFilter} initialFilter
	 * Initial filter values used to seed the filter state.
	 * @returns {void}
	 */
	protected constructor(initialFilter: TFilter)
	{
		this.initialFilter =
			{ ...initialFilter };
		this.filter =
			signal<TFilter>(initialFilter);
	}

	/**
	 * Get current filter value.
	 * @returns {TFilter}
	 * The current filter state.
	 */
	getCurrentFilter(): TFilter
	{
		return this.filter();
	}

	/**
	 * Update filter and reset to page 1. Merges partial filter updates with current state.
	 * @param {Partial<TFilter>} filter
	 * Partial filter values to merge into the current state.
	 * @returns {void}
	 */
	updateFilter(filter: Partial<TFilter>): void
	{
		this.filter.update(
			(current: TFilter) =>
				({
					...current,
					...filter,
					page: 1
				}) as TFilter);
	}

	/**
	 * Set page number without resetting other filters. Use this for pagination navigation.
	 * @param {number} page
	 * The page number to select.
	 * @returns {void}
	 */
	setPage(page: number): void
	{
		this.filter.update(
			(current: TFilter) =>
				({
					...current,
					page
				}) as TFilter);
	}

	/**
	 * Set page size and reset to page 1. Resetting to page 1 prevents
	 * showing empty page if current page exceeds new total.
	 * @param {number} pageSize
	 * The number of items per page.
	 * @returns {void}
	 */
	setPageSize(pageSize: number): void
	{
		this.filter.update(
			(current: TFilter) =>
				({
					...current,
					pageSize,
					page: 1
				}) as TFilter);
	}

	/**
	 * Get HTTP context for force refresh if triggered.
	 * Returns context with FORCE_REFRESH flag when cache bypass is needed.
	 * Used in TanStack Query queryFn to bypass cache on demand.
	 * @returns {HttpContext | undefined}
	 * The HTTP context with FORCE_REFRESH when a force refresh is active, otherwise undefined.
	 */
	protected getForceRefreshContext(): HttpContext | undefined
	{
		return this.forceRefreshTrigger()
			? new HttpContext()
			.set(FORCE_REFRESH, true)
			: undefined;
	}

	/**
	 * Trigger cache bypass for next query.
	 * Toggles the force refresh signal to invalidate TanStack Query cache.
	 * @returns {void}
	 */
	forceRefresh(): void
	{
		this.forceRefreshTrigger.update(
			(value: boolean) => !value);
	}

	/**
	 * Reset filter to initial state.
	 * Subclasses should call this from clearFilters() then add feature-specific cleanup.
	 * @returns {void}
	 */
	protected resetFilter(): void
	{
		this.filter.set(
			{ ...this.initialFilter });
	}

	/**
	 * Clear all filters and reset to defaults. Subclasses must
	 * override to provide feature-specific cleanup.
	 * @returns {void}
	 */
	abstract clearFilters(): void;
}
