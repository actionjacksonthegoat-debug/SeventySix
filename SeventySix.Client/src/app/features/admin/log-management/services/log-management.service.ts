/**
 * Log Management Service
 * Business logic layer for log operations
 * Uses TanStack Query for caching and state management
 * Uses repository pattern for data access (SRP, DIP)
 */

import {
	inject,
	Injectable,
	signal,
	computed,
	Signal,
	WritableSignal
} from "@angular/core";
import {
	injectQuery,
	injectMutation,
	QueryClient
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import { LogRepository } from "@admin/log-management/repositories";
import { LogFilterRequest } from "@admin/log-management/models";
import { getQueryConfig } from "@core/utils/query-config";

/**
 * Service for log management business logic
 * Manages filter state and provides TanStack Query hooks for log operations
 * All methods use TanStack Query for automatic caching and state management
 */
@Injectable({
	providedIn: "root"
})
export class LogManagementService
{
	private readonly logRepository: LogRepository = inject(LogRepository);
	private readonly queryClient: QueryClient = inject(QueryClient);
	private readonly queryConfig: ReturnType<typeof getQueryConfig> =
		getQueryConfig("logs");

	// Filter state using signals
	readonly filter: WritableSignal<LogFilterRequest> =
		signal<LogFilterRequest>({
			pageNumber: 1,
			pageSize: 50
		});

	// Selected log IDs using signals
	readonly selectedIds: WritableSignal<Set<number>> = signal<Set<number>>(
		new Set()
	);

	// Computed selected count
	readonly selectedCount: Signal<number> = computed(
		() => this.selectedIds().size
	);

	/**
	 * Query for logs based on current filter
	 * Automatically cached with TanStack Query
	 * @returns Query object with data, isLoading, error, etc.
	 */
	getLogs()
	{
		return injectQuery(() => ({
			queryKey: ["logs", this.filter()],
			queryFn: () =>
				lastValueFrom(this.logRepository.getAll(this.filter())),
			...this.queryConfig
		}));
	}

	/**
	 * Query for log count based on current filter
	 * @returns Query object with data, isLoading, error, etc.
	 */
	getLogCount()
	{
		return injectQuery(() => ({
			queryKey: ["logs", "count", this.filter()],
			queryFn: () =>
				lastValueFrom(this.logRepository.getCount(this.filter())),
			...this.queryConfig
		}));
	}

	/**
	 * Mutation for deleting a single log
	 * Automatically invalidates related queries on success
	 * @returns Mutation object with mutate, isPending, error, etc.
	 */
	deleteLog()
	{
		return injectMutation(() => ({
			mutationFn: (id: number) =>
				lastValueFrom(this.logRepository.delete(id)),
			onSuccess: () =>
			{
				// Invalidate all log queries
				this.queryClient.invalidateQueries({ queryKey: ["logs"] });
			}
		}));
	}

	/**
	 * Mutation for batch deleting logs
	 * Automatically invalidates related queries on success
	 * @returns Mutation object with mutate, isPending, error, etc.
	 */
	deleteLogs()
	{
		return injectMutation(() => ({
			mutationFn: (ids: number[]) =>
				lastValueFrom(this.logRepository.deleteBatch(ids)),
			onSuccess: () =>
			{
				this.clearSelection();
				this.queryClient.invalidateQueries({ queryKey: ["logs"] });
			}
		}));
	}

	/**
	 * Delete selected logs
	 */
	deleteSelected()
	{
		const mutation: ReturnType<typeof this.deleteLogs> = this.deleteLogs();
		const ids: number[] = Array.from(this.selectedIds());
		return mutation.mutate(ids);
	}

	/**
	 * Update filter and automatically refetch
	 * @param filter - Partial filter to update
	 */
	updateFilter(filter: Partial<LogFilterRequest>): void
	{
		this.filter.update((current) => ({
			...current,
			...filter,
			pageNumber: 1
		}));
	}

	/**
	 * Set page number
	 * @param pageNumber - Page number to load
	 */
	setPage(pageNumber: number): void
	{
		this.filter.update((current) => ({ ...current, pageNumber }));
	}

	/**
	 * Set page size
	 * @param pageSize - Number of items per page
	 */
	setPageSize(pageSize: number): void
	{
		this.filter.update((current) => ({
			...current,
			pageSize,
			pageNumber: 1
		}));
	}

	/**
	 * Clear all filters
	 */
	clearFilters(): void
	{
		this.filter.set({
			pageNumber: 1,
			pageSize: this.filter().pageSize || 50
		});
		this.clearSelection();
	}

	/**
	 * Toggle log ID selection
	 * @param id - Log ID to toggle
	 */
	toggleSelection(id: number): void
	{
		this.selectedIds.update((current) =>
		{
			const newSet: Set<number> = new Set(current);
			if (newSet.has(id))
			{
				newSet.delete(id);
			}
			else
			{
				newSet.add(id);
			}
			return newSet;
		});
	}

	/**
	 * Select all visible logs
	 * @param logIds - Array of log IDs to select
	 */
	selectAll(logIds: number[]): void
	{
		this.selectedIds.set(new Set(logIds));
	}

	/**
	 * Clear all selections
	 */
	clearSelection(): void
	{
		this.selectedIds.set(new Set());
	}

	/**
	 * Get current filter value
	 */
	getCurrentFilter(): LogFilterRequest
	{
		return this.filter();
	}

	/**
	 * Get current selected IDs
	 */
	getSelectedIds(): Set<number>
	{
		return this.selectedIds();
	}
}
