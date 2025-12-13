/**
 * Log Management Service
 * Business logic layer for log operations
 * Uses TanStack Query for caching and state management
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
import { HttpContext, HttpParams } from "@angular/common/http";
import { DateService } from "@infrastructure/services";
import { injectQuery } from "@tanstack/angular-query-experimental";
import { lastValueFrom, Observable } from "rxjs";
import { ApiService } from "@infrastructure/api-services/api.service";
import { LogQueryRequest } from "@admin/logs/models";
import { PagedResultOfLogDto } from "@infrastructure/api";
import { buildHttpParams } from "@infrastructure/utils/http-params.utility";
import { QueryKeys } from "@infrastructure/utils/query-keys";
import { BaseQueryService } from "@infrastructure/services/base-query.service";

/**
 * Service for log management business logic
 * Manages filter state and provides TanStack Query hooks for log operations
 * All methods use TanStack Query for automatic caching and state management
 * Provided at route level for proper garbage collection (see admin.routes.ts)
 */
@Injectable()
export class LogManagementService extends BaseQueryService<LogQueryRequest>
{
	protected readonly queryKeyPrefix: string = "logs";
	private readonly apiService: ApiService = inject(ApiService);
	private readonly endpoint: string = "logs";

	// Selected log IDs using signals
	readonly selectedIds: WritableSignal<Set<number>> = signal<Set<number>>(
		new Set()
	);

	// Computed selected count
	readonly selectedCount: Signal<number> = computed(
		() => this.selectedIds().size
	);

	private readonly dateService: DateService = inject(DateService);

	constructor()
	{
		// Initialize with 24-hour date range as default
		const dateService: DateService = new DateService();
		const now: Date = dateService.parseUTC(dateService.now());
		const startDate: Date = dateService.addHours(now, -24);
		super({
			page: 1,
			pageSize: 50,
			startDate: startDate,
			endDate: now,
			sortBy: "Id",
			sortDescending: true
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
			queryKey: QueryKeys.logs
				.paged(this.getCurrentFilter())
				.concat(this.forceRefreshTrigger()),
			queryFn: () =>
				lastValueFrom(this.getPaged(this.getCurrentFilter(), this.getForceRefreshContext())),
			...this.queryConfig
		}));
	}

	/** Mutation for deleting a single log. Automatically invalidates related queries on success. */
	deleteLog()
	{
		return this.createMutation<number, void>(
			(logId) =>
				this.apiService.delete<void>(`${this.endpoint}/${logId}`)
);
	}

	/**
	 * Mutation for batch deleting logs
	 * Automatically invalidates related queries on success
	 * @returns Mutation object with mutate, isPending, error, etc.
	 */
	deleteLogs()
	{
		return this.createMutation<number[], number>(
			(logIds) =>
				this.apiService.delete<number>(`${this.endpoint}/batch`, logIds),
			() =>
			{
				this.clearSelection();
				this.invalidateAll();
			}
);
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
		this.resetFilter();
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

	/** Gets paged logs with the given filter. */
	private getPaged(
		filter?: LogQueryRequest,
		context?: HttpContext
	): Observable<PagedResultOfLogDto>
	{
		const params: HttpParams | undefined =
			filter
				? buildHttpParams(filter)
				: undefined;

		return this.apiService.get<PagedResultOfLogDto>(this.endpoint, params, context);
	}
}
