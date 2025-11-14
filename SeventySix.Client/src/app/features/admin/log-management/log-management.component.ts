import { Component, OnDestroy, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatDialog } from "@angular/material/dialog";
import { LogManagementService } from "@admin/log-management/services";
import { LogFiltersComponent } from "@admin/log-management/components/log-filters/log-filters.component";
import { LogSummaryComponent } from "@admin/log-management/components/log-summary/log-summary.component";
import { LogTableComponent } from "@admin/log-management/components/log-table/log-table.component";
import { LogDetailDialogComponent } from "@admin/log-management/components/log-detail-dialog/log-detail-dialog.component";
import {
	LogResponse,
	LogFilterRequest,
	PagedLogResponse,
	LogStatistics
} from "@admin/log-management/models";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
	selector: "app-log-management",
	standalone: true,
	imports: [
		CommonModule,
		MatCardModule,
		LogFiltersComponent,
		LogSummaryComponent,
		LogTableComponent
	],
	templateUrl: "./log-management.component.html",
	styleUrl: "./log-management.component.scss"
})
export class LogManagementComponent implements OnDestroy
{
	logs = signal<PagedLogResponse | null>(null);
	isLoading = signal<boolean>(false);
	error = signal<string | null>(null);
	statistics = signal<LogStatistics | null>(null);

	constructor(
		private readonly logService: LogManagementService,
		private readonly dialog: MatDialog
	)
	{
		this.logService.logs$
			.pipe(takeUntilDestroyed())
			.subscribe((logs) => this.logs.set(logs));

		this.logService.loading$
			.pipe(takeUntilDestroyed())
			.subscribe((loading) => this.isLoading.set(loading));

		this.logService.error$
			.pipe(takeUntilDestroyed())
			.subscribe((error) => this.error.set(error));

		this.logService.statistics$
			.pipe(takeUntilDestroyed())
			.subscribe((stats) => this.statistics.set(stats));
	}

	onFilterChange(filter: Partial<LogFilterRequest>): void
	{
		this.logService.updateFilter(filter);
	}

	onAutoRefreshChange(enabled: boolean): void
	{
		this.logService.setAutoRefresh(enabled);
	}

	onPageChange(pageIndex: number): void
	{
		this.logService.setPage(pageIndex + 1);
	}

	onPageSizeChange(pageSize: number): void
	{
		this.logService.setPageSize(pageSize);
	}

	onLogSelected(log: LogResponse): void
	{
		const dialogRef = this.dialog.open(LogDetailDialogComponent, {
			data: log,
			width: "800px",
			maxWidth: "90vw"
		});

		dialogRef.componentInstance.deleteLog.subscribe((id: number) =>
		{
			this.logService.deleteLog(id).subscribe();
			dialogRef.close();
		});
	}

	onDeleteLog(id: number): void
	{
		this.logService.deleteLog(id).subscribe();
	}

	onDeleteSelected(_ids: number[]): void
	{
		this.logService.deleteSelected().subscribe();
	}

	onExportCsv(): void
	{
		// TODO: Implement CSV export functionality
	}

	onCleanupLogs(): void
	{
		// TODO: Implement cleanup functionality
	}

	ngOnDestroy(): void
	{
		this.logService.setAutoRefresh(false);
	}
}
