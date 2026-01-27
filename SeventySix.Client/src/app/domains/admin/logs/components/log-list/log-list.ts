import { LogDetailDialogComponent } from "@admin/logs/components/log-detail-dialog/log-detail-dialog.component";
import { LogDto, LogLevel, parseLogLevel } from "@admin/logs/models";
import { LogManagementService } from "@admin/logs/services";
import { DatePipe } from "@angular/common";
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	OutputRefSubscription,
	Signal
} from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { DataTableComponent } from "@shared/components";
import {
	BulkAction,
	BulkActionEvent,
	DateRangeEvent,
	FilterChangeEvent,
	QuickFilter,
	RowAction,
	RowActionEvent,
	SortChangeEvent,
	TableColumn
} from "@shared/models";
import { DialogService } from "@shared/services/dialog.service";
import { NotificationService } from "@shared/services/notification.service";

/**
 * Log list component using DataTableComponent
 * Displays list of logs with filtering, search, and pagination
 * Follows OnPush change detection for performance
 * Uses signals for reactive state management
 */
@Component(
	{
		selector: "app-log-list",
		imports: [DataTableComponent],
		templateUrl: "./log-list.html",
		styleUrl: "./log-list.scss",
		changeDetection: ChangeDetectionStrategy.OnPush,
		providers: [DatePipe]
	})
export class LogList
{
	/**
	 * Service that provides log-related data and mutations.
	 * @type {LogManagementService}
	 * @private
	 * @readonly
	 */
	private readonly logService: LogManagementService =
		inject(LogManagementService);

	/**
	 * Angular DatePipe used for formatting dates in the table.
	 * @type {DatePipe}
	 * @private
	 * @readonly
	 */
	private readonly datePipe: DatePipe =
		inject(DatePipe);

	/**
	 * Material dialog service used to open detail dialogs for logs.
	 * @type {MatDialog}
	 * @private
	 * @readonly
	 */
	private readonly dialog: MatDialog =
		inject(MatDialog);

	/**
	 * Dialog utility service for confirmations and prompts.
	 * @type {DialogService}
	 * @private
	 * @readonly
	 */
	private readonly dialogService: DialogService =
		inject(DialogService);

	/**
	 * Notification service used to display success/error toasts.
	 * @type {NotificationService}
	 * @private
	 * @readonly
	 */
	private readonly notificationService: NotificationService =
		inject(NotificationService);

	/**
	 * TanStack Query object for fetching paged logs.
	 * Contains `data`, `isLoading`, and `error` flags.
	 * @type {ReturnType<typeof this.logService.getLogs>}
	 */
	readonly logsQuery: ReturnType<typeof this.logService.getLogs> =
		this.logService.getLogs();

	/**
	 * Mutation for deleting a single log entry.
	 * @type {ReturnType<typeof this.logService.deleteLog>}
	 * @private
	 */
	private readonly deleteLogMutation: ReturnType<
		typeof this.logService.deleteLog> =
		this.logService.deleteLog();

	/**
	 * Mutation for deleting multiple logs in a batch.
	 * @type {ReturnType<typeof this.logService.deleteLogs>}
	 * @private
	 */
	private readonly deleteLogsMutation: ReturnType<
		typeof this.logService.deleteLogs> =
		this.logService.deleteLogs();

	// Table column definitions
	/**
	 * Columns configuration for the logs data table.
	 * @type {TableColumn<LogDto>[]}
	 */
	readonly columns: TableColumn<LogDto>[] =
		[
			{
				key: "logLevel",
				label: "Level",
				sortable: true,
				visible: true,
				type: "badge",
				formatter: (value: unknown): string =>
				{
					const level: LogLevel =
						parseLogLevel(value as string);
					return LogLevel[level];
				},
				badgeColor: (value: unknown): "primary" | "accent" | "warn" =>
				{
					const level: LogLevel =
						parseLogLevel(value as string);
					if (level === LogLevel.Error || level === LogLevel.Fatal)
					{
						return "warn";
					}
					if (level === LogLevel.Warning)
					{
						return "accent";
					}
					return "primary";
				}
			},
			{
				key: "createDate",
				label: "Create Date",
				sortable: true,
				visible: true,
				type: "date",
				formatter: (value: unknown): string =>
					this.datePipe.transform(value as Date, "short") ?? ""
			},
			{
				key: "message",
				label: "Message",
				sortable: false,
				visible: true,
				type: "text",
				formatter: (_value: unknown, row?: LogDto): string =>
					row?.exceptionMessage ?? row?.message ?? ""
			},
			{
				key: "sourceContext",
				label: "Source",
				sortable: false,
				visible: false,
				type: "text"
			},
			{
				key: "requestPath",
				label: "Request Path",
				sortable: false,
				visible: false,
				type: "text"
			},
			{
				key: "stackTrace",
				label: "Stack Trace",
				sortable: false,
				visible: false,
				type: "text"
			}
		];

	// Quick filters
	/**
	 * Predefined quick filters for log levels (All/Warnings/Errors).
	 * @type {QuickFilter<LogDto>[]}
	 */
	readonly quickFilters: QuickFilter<LogDto>[] =
		[
			{
				key: "all",
				label: "All",
				icon: "list",
				filterFn: (): boolean => true // Show all logs
			},
			{
				key: "warnings",
				label: "Warnings",
				icon: "warning",
				filterFn: (item: LogDto): boolean =>
				{
					const level: LogLevel =
						parseLogLevel(item.logLevel);
					// Warning level and above: Warning (3), Error (4), Fatal (5)
					return level >= LogLevel.Warning;
				}
			},
			{
				key: "errors",
				label: "Errors",
				icon: "error",
				filterFn: (item: LogDto): boolean =>
				{
					const level: LogLevel =
						parseLogLevel(item.logLevel);
					// Error level and above: Error (4), Fatal (5)
					return level >= LogLevel.Error;
				}
			}
		];

	// Row actions (view handled by rowClick)
	/**
	 * Row-level actions available for each log row (view/delete).
	 * @type {RowAction<LogDto>[]}
	 */
	readonly rowActions: RowAction<LogDto>[] =
		[
			{
				key: "delete",
				label: "Delete",
				icon: "delete",
				color: "warn"
			}
		];

	// Bulk actions
	/**
	 * Bulk actions for selected rows (e.g., delete selected).
	 * @type {BulkAction[]}
	 */
	readonly bulkActions: BulkAction[] =
		[
			{
				key: "delete",
				label: "Delete Selected",
				icon: "delete",
				color: "warn",
				requiresSelection: true
			}
		];

	// Computed signals
	/**
	 * Computed array of currently visible logs for the table.
	 * @type {Signal<LogDto[]>}
	 */
	readonly data: Signal<LogDto[]> =
		computed(
			(): LogDto[] =>
				(this.logsQuery.data()?.items as LogDto[]) ?? []);

	/**
	 * Total number of logs for pagination and header display.
	 * @type {Signal<number>}
	 */
	readonly totalCount: Signal<number> =
		computed(
			(): number =>
				this.logsQuery.data()?.totalCount ?? 0);

	/**
	 * Current paginator zero-based page index.
	 * @type {Signal<number>}
	 */
	readonly pageIndex: Signal<number> =
		computed(
			(): number =>
				(this.logsQuery.data()?.page ?? 1) - 1);

	/**
	 * Current page size for pagination.
	 * @type {Signal<number>}
	 */
	readonly pageSize: Signal<number> =
		computed(
			(): number =>
				this.logsQuery.data()?.pageSize ?? 25);

	/**
	 * Loading state for the logs query used to show spinners.
	 * @type {Signal<boolean>}
	 */
	readonly isLoading: Signal<boolean> =
		computed(
			(): boolean =>
				this.logsQuery.isLoading());

	/**
	 * Error message to display if the logs query fails.
	 * @type {Signal<string | null>}
	 */
	readonly error: Signal<string | null> =
		computed(
			(): string | null =>
				this.logsQuery.error() ? "Failed to load logs" : null);

	// Event handlers
	/**
	 * Apply a text search filter to the logs list.
	 * @param {string} searchText
	 * Text to search for in log messages and properties.
	 * @returns {void}
	 */
	onSearch(searchText: string): void
	{
		this.logService.updateFilter(
			{ searchTerm: searchText || undefined });
	}

	/**
	 * Forces a refresh of the log query (bypassing cache).
	 * @returns {void}
	 */
	onRefresh(): void
	{
		void this.logService.forceRefresh();
	}

	/**
	 * Change the active quick filter (all, warnings, errors).
	 * @param {FilterChangeEvent} event
	 * Details about the clicked filter.
	 * @returns {void}
	 */
	onFilterChange(event: FilterChangeEvent): void
	{
		// Always apply the filter that was clicked (single selection mode)
		// If trying to deactivate current filter, default to "all"
		let logLevel: string | null = null;
		const filterKey: string =
			event.active ? event.filterKey : "all";

		switch (filterKey)
		{
			case "all":
				// No filter - show all logs
				logLevel = null;
				break;
			case "warnings":
				// Warning level and above: Warning (3), Error (4), Fatal (5)
				logLevel = "Warning";
				break;
			case "errors":
				// Error level and above: Error (4), Fatal (5)
				logLevel = "Error";
				break;
		}

		this.logService.updateFilter(
			{ logLevel });
	}

	/**
	 * Update the log date range filter.
	 * @param {DateRangeEvent} event
	 * Contains selected start and end dates.
	 * @returns {void}
	 */
	onDateRangeChange(event: DateRangeEvent): void
	{
		// Update filter with date range
		this.logService.updateFilter(
			{
				startDate: event.startDate,
				endDate: event.endDate
			});
	}

	/**
	 * Update sorting parameters for the log query.
	 * @param {SortChangeEvent} event
	 * Sort field and direction.
	 * @returns {void}
	 */
	onSortChange(event: SortChangeEvent): void
	{
		this.logService.updateFilter(
			{
				sortBy: event.sortBy,
				sortDescending: event.sortDescending
			});
	}

	/**
	 * Handle row actions like view and delete.
	 * @param {RowActionEvent<LogDto>} event
	 * The row action event payload.
	 * @returns {void}
	 */
	onRowAction(event: RowActionEvent<LogDto>): void
	{
		switch (event.action)
		{
			case "view":
				this.viewLogDetails(event.row);
				break;
			case "delete":
				this.deleteLog(event.row.id);
				break;
		}
	}

	/**
	 * Handle bulk actions on selected rows (e.g., delete selected).
	 * @param {BulkActionEvent<LogDto>} event
	 * The bulk action event payload.
	 * @returns {void}
	 */
	onBulkAction(event: BulkActionEvent<LogDto>): void
	{
		switch (event.action)
		{
			case "delete":
				this.deleteLogs(event.selectedIds);
				break;
		}
	}

	/**
	 * Change page index for pagination.
	 * @param {number} pageIndex
	 * Zero-based page index selected by the paginator.
	 * @returns {void}
	 */
	onPageChange(pageIndex: number): void
	{
		this.logService.setPage(pageIndex + 1);
	}

	/**
	 * Change page size for pagination.
	 * @param {number} pageSize
	 * New page size selected by the user.
	 * @returns {void}
	 */
	onPageSizeChange(pageSize: number): void
	{
		this.logService.setPageSize(pageSize);
	}

	/**
	 * Handles row click to open log details dialog.
	 * @param {LogDto} log
	 * The clicked log row.
	 * @returns {void}
	 */
	onRowClick(log: LogDto): void
	{
		this.viewLogDetails(log);
	}

	/**
	 * Opens the log detail dialog to view full log information.
	 * @param {LogDto} log
	 * The log entry to display.
	 * @returns {void}
	 */
	private viewLogDetails(log: LogDto): void
	{
		const dialogRef: MatDialogRef<LogDetailDialogComponent> =
			this.dialog.open(LogDetailDialogComponent,
				{
					width: "900px",
					maxWidth: "95vw",
					maxHeight: "90vh",
					data: log,
					autoFocus: false,
					restoreFocus: true
				});

		// Subscribe to delete event from dialog
		const component: LogDetailDialogComponent =
			dialogRef.componentInstance;
		const subscription: OutputRefSubscription =
			component.deleteLog.subscribe(
				(id: number) =>
				{
					this.deleteLog(id);
				});

		// Clean up subscription when dialog closes
		dialogRef
			.afterClosed()
			.subscribe(
				() =>
				{
					subscription.unsubscribe();
				});
	}

	/**
	 * Deletes a single log entry after user confirmation.
	 * Shows confirmation dialog and notifies on success or error.
	 * @param {number} id
	 * The log ID to delete.
	 * @returns {void}
	 */
	private deleteLog(id: number): void
	{
		this
			.dialogService
			.confirmDelete("log")
			.subscribe(
				(confirmed: boolean) =>
				{
					if (!confirmed)
					{
						return;
					}

					this.deleteLogMutation.mutate(id,
						{
							onSuccess: () =>
							{
								this.notificationService.success(
									"Log entry deleted successfully");
							},
							onError: (error: Error) =>
							{
								this.notificationService.error(
									`Failed to delete log entry: ${error.message}`);
							}
						});
				});
	}

	/**
	 * Deletes multiple log entries in batch after confirmation.
	 * @param {number[]} ids
	 * Array of log IDs to delete.
	 * @returns {void}
	 */
	private deleteLogs(ids: number[]): void
	{
		if (ids.length === 0)
		{
			this.notificationService.warning("No logs selected for deletion");
			return;
		}

		const count: number =
			ids.length;

		this
			.dialogService
			.confirmDelete("log", count)
			.subscribe(
				(confirmed: boolean) =>
				{
					if (!confirmed)
					{
						return;
					}

					this.deleteLogsMutation.mutate(ids,
						{
							onSuccess: () =>
							{
								this.notificationService.success(
									`Successfully deleted ${count} log ${count === 1 ? "entry" : "entries"}`);
							},
							onError: (error: Error) =>
							{
								this.notificationService.error(
									`Failed to delete logs: ${error.message}`);
							}
						});
				});
	}
}
