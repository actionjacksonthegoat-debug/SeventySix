/**
 * Log Management Service
 * Business logic layer for log operations
 * Uses TanStack Query for caching and state management
 * Uses repository pattern for data access (SRP, DIP)
 * Extends BaseFilterService for filter state management
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
import { QueryKeys } from "@core/utils/query-keys";
import { BaseFilterService } from "@core/services/base-filter.service";

/**
 * Service for log management business logic
 * Manages filter state and provides TanStack Query hooks for log operations
 * All methods use TanStack Query for automatic caching and state management
 */
@Injectable({
	providedIn: "root"
})
export class LogManagementService extends BaseFilterService<LogFilterRequest>
{
	private readonly logRepository: LogRepository = inject(LogRepository);
	private readonly queryClient: QueryClient = inject(QueryClient);
	private readonly queryConfig: ReturnType<typeof getQueryConfig> =
		getQueryConfig("logs");

	// Selected log IDs using signals
	readonly selectedIds: WritableSignal<Set<number>> = signal<Set<number>>(
		new Set()
	);

	// Computed selected count
	readonly selectedCount: Signal<number> = computed(
		() => this.selectedIds().size
	);

	constructor()
	{
		super({
			pageNumber: 1,
			pageSize: 50
		});
	}

	/**
	 * Query for logs based on current filter
	 * Automatically cached with TanStack Query
	 * @returns Query object with data, isLoading, error, etc.
	 */
	getLogs()
	{
		return injectQuery(() => ({
			queryKey: QueryKeys.logs.paged(this.getCurrentFilter()),
			queryFn: () =>
				lastValueFrom(
					this.logRepository.getAllPaged(this.getCurrentFilter())
				),
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
			queryKey: QueryKeys.logs.count(this.getCurrentFilter()),
			queryFn: () =>
				lastValueFrom(
					this.logRepository.getCount(this.getCurrentFilter())
				),
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
				this.queryClient.invalidateQueries({
					queryKey: QueryKeys.logs.all
				});
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
				this.queryClient.invalidateQueries({
					queryKey: QueryKeys.logs.all
				});
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
	 * Clear all filters and reset to defaults
	 * Overrides base class method to also clear selection
	 */
	override clearFilters(): void
	{
		this.filter.set({
			pageNumber: 1,
			pageSize: 50
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
	 * Get current selected IDs
	 */
	getSelectedIds(): Set<number>
	{
		return this.selectedIds();
	}
}
