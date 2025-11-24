import { signal, WritableSignal } from "@angular/core";
import { BaseQueryRequest } from "@core/models";

/**
 * Base class for filter state management in paginated data tables
 * Provides common filter operations for features using server-side pagination
 *
 * @template TFilter - Filter type extending BaseQueryRequest
 *
 * @example
 * ```typescript
 * export class UserService extends BaseFilterService<UserQueryRequest>
 * {
 *   constructor()
 *   {
 *     super({ pageNumber: 1, pageSize: 50 });
 *   }
 *
 *   clearFilters(): void
 *   {
 *     this.filter.set({ pageNumber: 1, pageSize: 50, isActive: undefined });
 *   }
 * }
 * ```
 */
export abstract class BaseFilterService<TFilter extends BaseQueryRequest>
{
	/**
	 * Filter state signal
	 * Protected to allow subclass access while maintaining encapsulation
	 */
	protected readonly filter: WritableSignal<TFilter>;

	/**
	 * Initialize filter with default values
	 * @param initialFilter - Initial filter state with defaults
	 */
	protected constructor(initialFilter: TFilter)
	{
		this.filter = signal<TFilter>(initialFilter);
	}

	/**
	 * Get current filter value
	 * @returns Current filter state (read-only)
	 */
	getCurrentFilter(): TFilter
	{
		return this.filter();
	}

	/**
	 * Update filter and reset to page 1
	 * Merges partial filter updates with current state
	 * Automatically resets pageNumber to 1 to show first page of filtered results
	 *
	 * @param filter - Partial filter to update
	 */
	updateFilter(filter: Partial<TFilter>): void
	{
		this.filter.update(
			(current: TFilter) =>
				({
					...current,
					...filter,
					pageNumber: 1
				}) as TFilter
		);
	}

	/**
	 * Set page number without resetting other filters
	 * Use this for pagination navigation (next/previous page)
	 *
	 * @param pageNumber - Page number to load (1-based)
	 */
	setPage(pageNumber: number): void
	{
		this.filter.update(
			(current: TFilter) =>
				({
					...current,
					pageNumber
				}) as TFilter
		);
	}

	/**
	 * Set page size and reset to page 1
	 * Resetting to page 1 prevents showing empty page if current page exceeds new total
	 *
	 * @param pageSize - Number of items per page
	 */
	setPageSize(pageSize: number): void
	{
		this.filter.update(
			(current: TFilter) =>
				({
					...current,
					pageSize,
					pageNumber: 1
				}) as TFilter
		);
	}

	/**
	 * Clear all filters and reset to defaults
	 * Subclasses must override to provide feature-specific default values
	 *
	 * @example
	 * ```typescript
	 * clearFilters(): void
	 * {
	 *   this.filter.set({
	 *     pageNumber: 1,
	 *     pageSize: 50,
	 *     logLevel: undefined,
	 *     searchTerm: undefined
	 *   });
	 * }
	 * ```
	 */
	abstract clearFilters(): void;
}
