import {
	Component,
	computed,
	inject,
	Signal,
	ChangeDetectionStrategy,
	OutputRefSubscription
} from "@angular/core";
import { DatePipe } from "@angular/common";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { LogManagementService } from "@admin/logs/services";
import { LogDto, parseLogLevel, LogLevel } from "@admin/logs/models";
import { DataTableComponent } from "@shared/components";
import {
	TableColumn,
	QuickFilter,
	RowAction,
	BulkAction,
	RowActionEvent,
	BulkActionEvent,
	FilterChangeEvent,
	DateRangeEvent,
	SortChangeEvent
} from "@shared/models";
import { LogDetailDialogComponent } from "@admin/logs/components/log-detail-dialog/log-detail-dialog.component";
import { DialogService } from "@infrastructure/services/dialog.service";
import { NotificationService } from "@infrastructure/services/notification.service";

/**
 * Log list component using DataTableComponent
 * Displays list of logs with filtering, search, and pagination
 * Follows OnPush change detection for performance
 * Uses signals for reactive state management
 */
@Component({
	selector: "app-log-list",
	imports: [DataTableComponent],
	templateUrl: "./log-list.html",
	styleUrl: "./log-list.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [DatePipe]
})
export class LogList
{
	private readonly logService: LogManagementService =
		inject(LogManagementService);
	private readonly datePipe: DatePipe = inject(DatePipe);
	private readonly dialog: MatDialog = inject(MatDialog);
	private readonly dialogService: DialogService = inject(DialogService);
	private readonly notificationService: NotificationService =
		inject(NotificationService);

	// TanStack Query
	readonly logsQuery: ReturnType<LogManagementService["getLogs"]> =
		this.logService.getLogs();

	// Mutations
	private readonly deleteLogMutation: ReturnType<
		LogManagementService["deleteLog"]
	> = this.logService.deleteLog();
	private readonly deleteLogsMutation: ReturnType<
		LogManagementService["deleteLogs"]
	> = this.logService.deleteLogs();

	// Table column definitions
	readonly columns: TableColumn<LogDto>[] = [
		{
			key: "logLevel",
			label: "Level",
			sortable: true,
			visible: true,
			type: "badge",
			formatter: (value: unknown): string =>
			{
				const level: LogLevel = parseLogLevel(value as string);
				return LogLevel[level];
			},
			badgeColor: (value: unknown): "primary" | "accent" | "warn" =>
			{
				const level: LogLevel = parseLogLevel(value as string);
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
	readonly quickFilters: QuickFilter<LogDto>[] = [
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
				const level: LogLevel = parseLogLevel(item.logLevel);
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
				const level: LogLevel = parseLogLevel(item.logLevel);
				// Error level and above: Error (4), Fatal (5)
				return level >= LogLevel.Error;
			}
		}
	];

	// Row actions (view handled by rowClick)
	readonly rowActions: RowAction<LogDto>[] = [
		{
			key: "delete",
			label: "Delete",
			icon: "delete",
			color: "warn"
		}
	];

	// Bulk actions
	readonly bulkActions: BulkAction[] = [
		{
			key: "delete",
			label: "Delete Selected",
			icon: "delete",
			color: "warn",
			requiresSelection: true
		}
	];

	// Computed signals
	readonly data: Signal<LogDto[]> = computed(
		(): LogDto[] => this.logsQuery.data()?.items ?? []
	);
	readonly totalCount: Signal<number> = computed(
		(): number => this.logsQuery.data()?.totalCount ?? 0
	);
	readonly pageIndex: Signal<number> = computed(
		(): number => (this.logsQuery.data()?.page ?? 1) - 1
	);
	readonly pageSize: Signal<number> = computed(
		(): number => this.logsQuery.data()?.pageSize ?? 25
	);
	readonly isLoading: Signal<boolean> = computed((): boolean =>
		this.logsQuery.isLoading()
	);
	readonly error: Signal<string | null> = computed((): string | null =>
		this.logsQuery.error() ? "Failed to load logs" : null
	);

	// Event handlers
	onSearch(searchText: string): void
	{
		this.logService.updateFilter({ searchTerm: searchText || undefined });
	}

	onRefresh(): void
	{
		void this.logsQuery.refetch();
	}

	onFilterChange(event: FilterChangeEvent): void
	{
		// Always apply the filter that was clicked (single selection mode)
		// If trying to deactivate current filter, default to "all"
		let logLevel: string | null = null;
		const filterKey: string = event.active ? event.filterKey : "all";

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

		this.logService.updateFilter({ logLevel });
	}

	onDateRangeChange(event: DateRangeEvent): void
	{
		// Update filter with date range
		this.logService.updateFilter({
			startDate: event.startDate,
			endDate: event.endDate
		});
	}

	onSortChange(event: SortChangeEvent): void
	{
		this.logService.updateFilter({
			sortBy: event.sortBy,
			sortDescending: event.sortDescending
		});
	}

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

	onBulkAction(event: BulkActionEvent<LogDto>): void
	{
		switch (event.action)
		{
			case "delete":
				this.deleteLogs(event.selectedIds);
				break;
		}
	}

	onPageChange(pageIndex: number): void
	{
		this.logService.setPage(pageIndex + 1);
	}

	onPageSizeChange(pageSize: number): void
	{
		this.logService.setPageSize(pageSize);
	}

	/**
	 * Handles row click to open log details dialog
	 * @param log - The clicked log row
	 */
	onRowClick(log: LogDto): void
	{
		this.viewLogDetails(log);
	}

	/**
	 * Opens the log detail dialog to view full log information
	 * @param log - The log entry to display
	 */
	private viewLogDetails(log: LogDto): void
	{
		const dialogRef: MatDialogRef<LogDetailDialogComponent> =
			this.dialog.open(LogDetailDialogComponent, {
				width: "900px",
				maxWidth: "95vw",
				maxHeight: "90vh",
				data: log,
				autoFocus: false,
				restoreFocus: true
			});

		// Subscribe to delete event from dialog
		const component: LogDetailDialogComponent = dialogRef.componentInstance;
		const subscription: OutputRefSubscription =
			component.deleteLog.subscribe((id: number) =>
			{
				this.deleteLog(id);
			});

		// Clean up subscription when dialog closes
		dialogRef.afterClosed().subscribe(() =>
		{
			subscription.unsubscribe();
		});
	}

	/**
	 * Deletes a single log entry
	 * Shows confirmation and handles success/error states
	 * @param id - The log ID to delete
	 */
	private deleteLog(id: number): void
	{
		this.dialogService
			.confirmDelete("log")
			.subscribe((confirmed: boolean) =>
			{
				if (!confirmed)
				{
					return;
				}

				this.deleteLogMutation.mutate(id, {
					onSuccess: () =>
					{
						this.notificationService.success(
							"Log entry deleted successfully"
						);
					},
					onError: (error: Error) =>
					{
						this.notificationService.error(
							`Failed to delete log entry: ${error.message}`
						);
					}
				});
			});
	}

	/**
	 * Deletes multiple log entries in batch
	 * Shows confirmation and handles success/error states
	 * @param ids - Array of log IDs to delete
	 */
	private deleteLogs(ids: number[]): void
	{
		if (ids.length === 0)
		{
			this.notificationService.warning("No logs selected for deletion");
			return;
		}

		const count: number = ids.length;

		this.dialogService
			.confirmDelete("log", count)
			.subscribe((confirmed: boolean) =>
			{
				if (!confirmed)
				{
					return;
				}

				this.deleteLogsMutation.mutate(ids, {
					onSuccess: () =>
					{
						this.notificationService.success(
							`Successfully deleted ${count} log ${count === 1 ? "entry" : "entries"}`
						);
					},
					onError: (error: Error) =>
					{
						this.notificationService.error(
							`Failed to delete logs: ${error.message}`
						);
					}
				});
			});
	}
}
