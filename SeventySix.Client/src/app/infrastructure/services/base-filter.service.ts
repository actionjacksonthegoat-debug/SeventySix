import { signal, WritableSignal } from "@angular/core";
import { BaseQueryRequest } from "@infrastructure/models";

/**
 * Base class for filter state management in paginated data tables.
 * Provides common filter operations for features using server-side pagination.
 * @template TFilter - Filter type extending BaseQueryRequest
 */
export abstract class BaseFilterService<TFilter extends BaseQueryRequest>
{
	/** Filter state signal. Protected to allow subclass access while maintaining encapsulation. */
	protected readonly filter: WritableSignal<TFilter>;

	/** Initialize filter with default values. */
	protected constructor(initialFilter: TFilter)
	{
		this.filter = signal<TFilter>(initialFilter);
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
				}) as TFilter
		);
	}

	/** Set page number without resetting other filters. Use this for pagination navigation. */
	setPage(page: number): void
	{
		this.filter.update(
			(current: TFilter) =>
				({
					...current,
					page
				}) as TFilter
		);
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
				}) as TFilter
		);
	}

	/** Clear all filters and reset to defaults. Subclasses must override to provide feature-specific default values. */
	abstract clearFilters(): void;
}
