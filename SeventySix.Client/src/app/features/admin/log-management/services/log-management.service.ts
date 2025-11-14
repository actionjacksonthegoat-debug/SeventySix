import { inject, Injectable, signal, computed } from "@angular/core";
import {
	injectQuery,
	injectMutation,
	injectQueryClient
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import { LogsApiService } from "./logs-api.service";
import { LogFilterRequest } from "@admin/log-management/models";
import { getQueryConfig } from "@core/utils/query-config";

/**
 * State management service for the log management page
 * Uses TanStack Query for data fetching and caching
 * Uses Angular signals for reactive state management
 */
@Injectable({
	providedIn: "root"
})
export class LogManagementService
{
	private readonly logsApiService = inject(LogsApiService);
	private readonly queryClient = injectQueryClient();
	private readonly queryConfig = getQueryConfig("logs");

	// Filter state using signals
	readonly filter = signal<LogFilterRequest>({
		pageNumber: 1,
		pageSize: 50
	});

	// Selected log IDs using signals
	readonly selectedIds = signal<Set<number>>(new Set());

	// Computed selected count
	readonly selectedCount = computed(() => this.selectedIds().size);

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
				lastValueFrom(this.logsApiService.getLogs(this.filter())),
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
				lastValueFrom(this.logsApiService.getLogCount(this.filter())),
			...this.queryConfig
		}));
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
	 * Mutation for deleting a single log
	 * @returns Mutation object with mutate, isPending, error, etc.
	 */
	deleteLog()
	{
		return injectMutation(() => ({
			mutationFn: (id: number) =>
				lastValueFrom(this.logsApiService.deleteLog(id)),
			onSuccess: () =>
			{
				// Invalidate all log queries
				this.queryClient.invalidateQueries({ queryKey: ["logs"] });
			}
		}));
	}

	/**
	 * Mutation for batch deleting logs
	 * @returns Mutation object with mutate, isPending, error, etc.
	 */
	deleteLogs()
	{
		return injectMutation(() => ({
			mutationFn: (ids: number[]) =>
				lastValueFrom(this.logsApiService.deleteLogs(ids)),
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
		const mutation = this.deleteLogs();
		const ids = Array.from(this.selectedIds());
		return mutation.mutate(ids);
	}

	/**
	 * Toggle log ID selection
	 * @param id - Log ID to toggle
	 */
	toggleSelection(id: number): void
	{
		this.selectedIds.update((current) =>
		{
			const newSet = new Set(current);
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
