import { HttpContext } from "@angular/common/http";
import { signal, WritableSignal } from "@angular/core";
import { FORCE_REFRESH } from "@infrastructure/interceptors/cache-bypass.interceptor";
import { BaseQueryRequest } from "@shared/models";

/**
 * Base class for filter state management in paginated data tables.
 * Provides common filter operations for features using server-side pagination.
 * Includes force refresh functionality to bypass cache when needed.
 * @template TFilter - Filter type extending BaseQueryRequest
 */
export abstract class BaseFilterService<TFilter extends BaseQueryRequest>
{
	/** Filter state signal. Protected to allow subclass access while maintaining encapsulation. */
	protected readonly filter: WritableSignal<TFilter>;

	/** Initial filter state for reset functionality (DRY principle) */
	private readonly initialFilter: TFilter;

	/** Force refresh trigger - toggle to bypass cache on next query */
	protected readonly forceRefreshTrigger: WritableSignal<boolean> =
		signal<boolean>(false);

	/** Initialize filter with default values and store for reset. */
	protected constructor(initialFilter: TFilter)
	{
		this.initialFilter =
			{ ...initialFilter };
		this.filter =
			signal<TFilter>(initialFilter);
	}

	/** Get current filter value. */
	getCurrentFilter(): TFilter
	{
		return this.filter();
	}

	/** Update filter and reset to page 1. Merges partial filter updates with current state. */
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

	/** Set page number without resetting other filters. Use this for pagination navigation. */
	setPage(page: number): void
	{
		this.filter.update(
			(current: TFilter) =>
				({
					...current,
					page
				}) as TFilter);
	}

	/** Set page size and reset to page 1. Resetting to page 1 prevents showing empty page if current page exceeds new total. */
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
	 */
	forceRefresh(): void
	{
		this.forceRefreshTrigger.update((value: boolean) => !value);
	}

	/**
	 * Reset filter to initial state.
	 * Subclasses should call this from clearFilters() then add feature-specific cleanup.
	 */
	protected resetFilter(): void
	{
		this.filter.set({ ...this.initialFilter });
	}

	/** Clear all filters and reset to defaults. Subclasses must override to provide feature-specific cleanup. */
	abstract clearFilters(): void;
}
