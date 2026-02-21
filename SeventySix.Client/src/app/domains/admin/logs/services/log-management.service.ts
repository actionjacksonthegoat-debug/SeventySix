/**
 * Log Management Service
 * Business logic layer for log operations
 * Uses TanStack Query for caching and state management
 * Extends BaseFilterService for filter state management
 */

import { ADMIN_API_ENDPOINTS } from "@admin/constants";
import {
	LogQueryRequest,
	PagedResultOfLogDto
} from "@admin/logs/models";
import { HttpContext, HttpParams } from "@angular/common/http";
import {
	computed,
	inject,
	Injectable,
	Signal,
	signal,
	WritableSignal
} from "@angular/core";
import { DateService } from "@shared/services";
import { ApiService } from "@shared/services/api.service";
import { BaseQueryService } from "@shared/services/base-query.service";
import { buildHttpParams } from "@shared/utilities/http-params.utility";
import { QueryKeys } from "@shared/utilities/query-keys.utility";
import { toggleSetItem } from "@shared/utilities/selection.utility";
import {
	CreateMutationResult,
	CreateQueryResult,
	injectQuery
} from "@tanstack/angular-query-experimental";
import { lastValueFrom, Observable } from "rxjs";

/**
 * Service for log management business logic
 * Manages filter state and provides TanStack Query hooks for log operations
 * All methods use TanStack Query for automatic caching and state management
 * Provided at route level for proper garbage collection (see admin.routes.ts)
 */
@Injectable()
export class LogManagementService extends BaseQueryService<LogQueryRequest>
{
	/**
	 * Query key prefix used by TanStack Query for namespacing log queries.
	 * @type {string}
	 */
	protected readonly queryKeyPrefix: string = "logs";

	/**
	 * API service used to communicate with the backend for log operations.
	 * @type {ApiService}
	 * @private
	 * @readonly
	 */
	private readonly apiService: ApiService =
		inject(ApiService);

	/**
	 * Endpoint path for log-related API requests.
	 * @type {typeof ADMIN_API_ENDPOINTS.LOGS}
	 * @private
	 * @readonly
	 */
	private readonly endpoint: typeof ADMIN_API_ENDPOINTS.LOGS =
		ADMIN_API_ENDPOINTS.LOGS;

	/**
	 * Selected log IDs using a writable signal.
	 * Selection state is managed in this service (not DataTableSelectionManager)
	 * because batch delete operations require service-level coordination.
	 * For new table components, prefer using DataTableSelectionManager.
	 * @type {WritableSignal<Set<number>>}
	 * @readonly
	 */
	readonly selectedIds: WritableSignal<Set<number>> =
		signal<Set<number>>(
			new Set());

	/**
	 * Number of selected logs, computed from `selectedIds`.
	 * @type {Signal<number>}
	 */
	readonly selectedCount: Signal<number> =
		computed(
			() => this.selectedIds().size);

	/**
	 * Date helper service used for parsing and relative time calculations.
	 * @type {DateService}
	 * @private
	 * @readonly
	 */
	private readonly dateService: DateService =
		inject(DateService);

	constructor()
	{
		// Calculate default date range before calling super
		const dateService: DateService =
			inject(DateService);
		const now: Date =
			dateService.parseUTC(dateService.now());
		const startDate: Date =
			dateService.addDays(now, -7);

		// Initialize with 7-day date range as default
		super(
			{
				page: 1,
				pageSize: 50,
				startDate: startDate,
				endDate: now,
				sortBy: "Id",
				sortDescending: true
			});
	}

	/**
	 * Query logs using the current filter state.
	 * Uses TanStack Query to cache and manage server requests for paged log results.
	 * @returns {ReturnType<typeof injectQuery>}
	 * Query object with `data`, `isLoading`, `error`, and related flags.
	 */
	getLogs(): CreateQueryResult<PagedResultOfLogDto>
	{
		return injectQuery(
			() => ({
				queryKey: QueryKeys
					.logs
					.paged(this.getCurrentFilter())
					.concat(this.forceRefreshTrigger()),
				queryFn: () =>
					lastValueFrom(this.getPaged(this.getCurrentFilter(), this.getForceRefreshContext())),
				...this.queryConfig
			}));
	}

	/**
	 * Create a mutation for deleting a single log by ID.
	 * On success, related queries are invalidated by the mutation lifecycle.
	 * @returns {CreateMutationResult<void, Error, number>}
	 * Mutation object with `mutate`, `isPending`, and `error` properties.
	 */
	deleteLog(): CreateMutationResult<void, Error, number>
	{
		return this.createMutation<number, void>(
			(logId) =>
				this.apiService.delete<void>(`${this.endpoint}/${logId}`));
	}

	/**
	 * Create a mutation to delete multiple logs in a batch.
	 * Invalidates query caches and clears selection on success.
	 * @returns {CreateMutationResult<number, Error, number[]>}
	 * Mutation object providing `mutate` for performing the batch delete.
	 */
	deleteLogs(): CreateMutationResult<number, Error, number[]>
	{
		return this.createMutation<number[], number>(
			(logIds) =>
				this.apiService.delete<number>(`${this.endpoint}/batch`, logIds),
			() =>
			{
				this.clearSelection();
				this.invalidateAll();
			});
	}

	/**
	 * Delete selected logs.
	 * @returns {void}
	 * Initiates batch delete mutation for currently selected IDs.
	 */
	deleteSelected(): void
	{
		const mutation: CreateMutationResult<number, Error, number[]> =
			this.deleteLogs();
		const ids: number[] =
			Array.from(this.selectedIds());
		return mutation.mutate(ids);
	}

	/**
	 * Clear all filters and reset to defaults.
	 * Overrides base class method to also clear selection.
	 * @returns {void}
	 */
	override clearFilters(): void
	{
		this.resetFilter();
		this.clearSelection();
	}

	/**
	 * Toggle log ID selection.
	 * @param {number} logId
	 * Log ID to toggle.
	 * @returns {void}
	 */
	toggleSelection(logId: number): void
	{
		const updatedIds: Set<number> =
			toggleSetItem(
				this.selectedIds(),
				logId);

		this.selectedIds.set(updatedIds);
	}

	/**
	 * Select all visible logs.
	 * @param {number[]} logIds
	 * Array of log IDs to select.
	 * @returns {void}
	 */
	selectAll(logIds: number[]): void
	{
		this.selectedIds.set(new Set(logIds));
	}

	/**
	 * Clear all selections.
	 * @returns {void}
	 */
	clearSelection(): void
	{
		this.selectedIds.set(new Set());
	}

	/**
	 * Get current selected IDs.
	 * @returns {Set<number>}
	 * Current set of selected log IDs.
	 */
	getSelectedIds(): Set<number>
	{
		return this.selectedIds();
	}

	/**
	 * Gets paged logs with the given filter.
	 * @param {LogQueryRequest | undefined} filter
	 * Optional filter object to apply to the query.
	 * @param {HttpContext | undefined} context
	 * Optional HTTP context to control request behaviour.
	 * @returns {Observable<PagedResultOfLogDto>}
	 * Observable that resolves to paged log results.
	 */
	private getPaged(
		filter?: LogQueryRequest,
		context?: HttpContext): Observable<PagedResultOfLogDto>
	{
		const params: HttpParams | undefined =
			filter
				? buildHttpParams(filter)
				: undefined;

		return this.apiService.get<PagedResultOfLogDto>(this.endpoint, params, context);
	}
}