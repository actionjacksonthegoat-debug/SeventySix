import { Component, computed, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatDialog } from "@angular/material/dialog";
import { LogManagementService } from "@admin/log-management/services";
import { LogFiltersComponent } from "@admin/log-management/components/log-filters/log-filters.component";
import { LogSummaryComponent } from "@admin/log-management/components/log-summary/log-summary.component";
import { LogTableComponent } from "@admin/log-management/components/log-table/log-table.component";
import { LogDetailDialogComponent } from "@admin/log-management/components/log-detail-dialog/log-detail-dialog.component";
import { LogResponse, LogFilterRequest } from "@admin/log-management/models";

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
export class LogManagementComponent
{
	private readonly logService = inject(LogManagementService);
	private readonly dialog = inject(MatDialog);

	// TanStack Query handles loading, error, and data states
	readonly logsQuery = this.logService.getLogs();
	readonly logCountQuery = this.logService.getLogCount();

	// Computed signals for derived state
	readonly logs = computed(() => this.logsQuery.data() ?? null);
	readonly isLoading = computed(() => this.logsQuery.isLoading());
	readonly error = computed(() =>
		this.logsQuery.error() ? "Failed to load logs. Please try again." : null
	);
	readonly statistics = computed(() =>
	{
		const total = this.logCountQuery.data()?.total ?? 0;
		return {
			totalLogs: total,
			errorCount: 0,
			warningCount: 0,
			infoCount: 0,
			debugCount: 0,
			criticalCount: 0,
			oldestLogDate: null,
			newestLogDate: null
		};
	});

	onFilterChange(filter: Partial<LogFilterRequest>): void
	{
		this.logService.updateFilter(filter);
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

		const deleteMutation = this.logService.deleteLog();
		dialogRef.componentInstance.deleteLog.subscribe((id: number) =>
		{
			deleteMutation.mutate(id);
			dialogRef.close();
		});
	}

	onDeleteLog(id: number): void
	{
		const deleteMutation = this.logService.deleteLog();
		deleteMutation.mutate(id);
	}

	onDeleteSelected(_ids: number[]): void
	{
		this.logService.deleteSelected();
	}

	onExportCsv(): void
	{
		// TODO: Implement CSV export functionality
	}

	onCleanupLogs(): void
	{
		// TODO: Implement cleanup functionality
	}
}
