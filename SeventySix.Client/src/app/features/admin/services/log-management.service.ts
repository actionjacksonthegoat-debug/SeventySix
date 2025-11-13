import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject, Observable, combineLatest, Subscription } from "rxjs";
import {
	tap,
	catchError,
	debounceTime,
	distinctUntilChanged
} from "rxjs/operators";
import { LogsApiService } from "./logs-api.service";
import {
	LogFilterRequest,
	PagedLogResponse,
	LogStatistics
} from "@core/models/logs";

/**
 * State management service for the log management page
 */
@Injectable({
	providedIn: "root"
})
export class LogManagementService implements OnDestroy
{
	private filterSubscription?: Subscription;
	// Filter state
	private readonly filterSubject = new BehaviorSubject<LogFilterRequest>({
		pageNumber: 1,
		pageSize: 50
	});
	public readonly filter$ = this.filterSubject.asObservable();

	// Loading state
	private readonly loadingSubject = new BehaviorSubject<boolean>(false);
	public readonly loading$ = this.loadingSubject.asObservable();

	// Error state
	private readonly errorSubject = new BehaviorSubject<string | null>(null);
	public readonly error$ = this.errorSubject.asObservable();

	// Logs data
	private readonly logsSubject = new BehaviorSubject<PagedLogResponse | null>(
		null
	);
	public readonly logs$ = this.logsSubject.asObservable();

	// Selected log IDs
	private readonly selectedIdsSubject = new BehaviorSubject<Set<number>>(
		new Set()
	);
	public readonly selectedIds$ = this.selectedIdsSubject.asObservable();

	// Statistics
	private readonly statisticsSubject =
		new BehaviorSubject<LogStatistics | null>(null);
	public readonly statistics$ = this.statisticsSubject.asObservable();

	// Auto-refresh toggle
	private readonly autoRefreshSubject = new BehaviorSubject<boolean>(false);
	public readonly autoRefresh$ = this.autoRefreshSubject.asObservable();

	constructor(private logsApiService: LogsApiService)
	{
		// Set up automatic data loading when filter changes
		this.filterSubscription = this.filter$
			.pipe(
				debounceTime(300),
				distinctUntilChanged(
					(prev, curr) =>
						JSON.stringify(prev) === JSON.stringify(curr)
				)
			)
			.subscribe(() => this.loadLogs());
	}

	ngOnDestroy(): void
	{
		this.filterSubscription?.unsubscribe();
	}

	/**
	 * Load logs based on current filter
	 */
	private loadLogs(): void
	{
		this.loadingSubject.next(true);
		this.errorSubject.next(null);

		const filter = this.filterSubject.value;

		combineLatest([
			this.logsApiService.getLogs(filter),
			this.logsApiService.getLogCount(filter)
		])
			.pipe(
				tap(([logsResponse, countResponse]) =>
				{
					this.logsSubject.next(logsResponse);
					this.updateStatistics(countResponse.total);
					this.loadingSubject.next(false);
				}),
				catchError((error) =>
				{
					this.errorSubject.next(
						"Failed to load logs. Please try again."
					);
					this.loadingSubject.next(false);
					throw error;
				})
			)
			.subscribe();
	}

	/**
	 * Update filter and trigger reload
	 * @param filter - Partial filter to update
	 */
	updateFilter(filter: Partial<LogFilterRequest>): void
	{
		const currentFilter = this.filterSubject.value;
		this.filterSubject.next({ ...currentFilter, ...filter, pageNumber: 1 });
	}

	/**
	 * Set page number
	 * @param pageNumber - Page number to load
	 */
	setPage(pageNumber: number): void
	{
		const currentFilter = this.filterSubject.value;
		this.filterSubject.next({ ...currentFilter, pageNumber });
	}

	/**
	 * Set page size
	 * @param pageSize - Number of items per page
	 */
	setPageSize(pageSize: number): void
	{
		const currentFilter = this.filterSubject.value;
		this.filterSubject.next({ ...currentFilter, pageSize, pageNumber: 1 });
	}

	/**
	 * Clear all filters
	 */
	clearFilters(): void
	{
		this.filterSubject.next({
			pageNumber: 1,
			pageSize: this.filterSubject.value.pageSize || 50
		});
		this.clearSelection();
	}

	/**
	 * Refresh current data
	 */
	refresh(): void
	{
		this.loadLogs();
	}

	/**
	 * Toggle log ID selection
	 * @param id - Log ID to toggle
	 */
	toggleSelection(id: number): void
	{
		const currentSelection = new Set(this.selectedIdsSubject.value);
		if (currentSelection.has(id))
		{
			currentSelection.delete(id);
		}
		else
		{
			currentSelection.add(id);
		}
		this.selectedIdsSubject.next(currentSelection);
	}

	/**
	 * Select all visible logs
	 */
	selectAll(): void
	{
		const logs = this.logsSubject.value;
		if (!logs) return;

		const allIds = new Set(logs.data.map((log) => log.id));
		this.selectedIdsSubject.next(allIds);
	}

	/**
	 * Clear all selections
	 */
	clearSelection(): void
	{
		this.selectedIdsSubject.next(new Set());
	}

	/**
	 * Delete selected logs
	 * @returns Observable of deleted count
	 */
	deleteSelected(): Observable<number>
	{
		const ids = Array.from(this.selectedIdsSubject.value);
		if (ids.length === 0)
		{
			throw new Error("No logs selected for deletion");
		}

		this.loadingSubject.next(true);

		return this.logsApiService.deleteLogs(ids).pipe(
			tap(() =>
			{
				this.clearSelection();
				this.refresh();
			}),
			catchError((error) =>
			{
				this.errorSubject.next(
					"Failed to delete logs. Please try again."
				);
				this.loadingSubject.next(false);
				throw error;
			})
		);
	}

	/**
	 * Delete a single log by ID
	 * @param id - Log ID to delete
	 * @returns Observable of void
	 */
	deleteLog(id: number): Observable<void>
	{
		this.loadingSubject.next(true);

		return this.logsApiService.deleteLog(id).pipe(
			tap(() =>
			{
				this.refresh();
			}),
			catchError((error) =>
			{
				this.errorSubject.next(
					"Failed to delete log. Please try again."
				);
				this.loadingSubject.next(false);
				throw error;
			})
		);
	}

	/**
	 * Toggle auto-refresh
	 * @param enabled - Whether to enable auto-refresh
	 */
	setAutoRefresh(enabled: boolean): void
	{
		this.autoRefreshSubject.next(enabled);
	}

	/**
	 * Update statistics based on total count
	 * @param totalCount - Total log count
	 */
	private updateStatistics(totalCount: number): void
	{
		// For now, we'll just store the total count
		// In a future enhancement, we could make separate API calls for error/warning/fatal counts
		this.statisticsSubject.next({
			totalCount,
			errorCount: 0,
			warningCount: 0,
			fatalCount: 0,
			lastUpdated: new Date()
		});
	}

	/**
	 * Get current filter value
	 */
	getCurrentFilter(): LogFilterRequest
	{
		return this.filterSubject.value;
	}

	/**
	 * Get current logs value
	 */
	getCurrentLogs(): PagedLogResponse | null
	{
		return this.logsSubject.value;
	}

	/**
	 * Get current selected IDs
	 */
	getSelectedIds(): Set<number>
	{
		return this.selectedIdsSubject.value;
	}
}
