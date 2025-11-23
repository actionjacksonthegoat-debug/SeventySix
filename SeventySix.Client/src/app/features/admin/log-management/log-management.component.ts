import {
	Component,
	inject,
	signal,
	WritableSignal,
	ChangeDetectionStrategy
} from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { LogManagementService } from "@admin/log-management/services";
import {
	LogList,
	LogDetailDialogComponent
} from "@admin/log-management/components";
import { LogResponse } from "@admin/log-management/models";

/**
 * Log Management component.
 * Smart container for log management functionality.
 * Provides page layout and hosts the LogList component.
 * Follows Smart/Presentational component pattern for separation of concerns.
 */
@Component({
	selector: "app-log-management",
	standalone: true,
	imports: [MatIconModule, MatButtonModule, LogList],
	templateUrl: "./log-management.component.html",
	styleUrl: "./log-management.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogManagementComponent
{
	private readonly logService: LogManagementService =
		inject(LogManagementService);
	private readonly dialog: MatDialog = inject(MatDialog);

	// Page-level state
	readonly pageTitle: WritableSignal<string> = signal("Log Management");

	private readonly deleteMutation: ReturnType<
		LogManagementService["deleteLog"]
	> = this.logService.deleteLog();

	onLogSelected(log: LogResponse): void
	{
		const dialogRef: import("@angular/material/dialog").MatDialogRef<LogDetailDialogComponent> =
			this.dialog.open(LogDetailDialogComponent, {
				data: log,
				width: "800px",
				maxWidth: "90vw"
			});

		dialogRef.componentInstance.deleteLog.subscribe((id: number) =>
		{
			this.deleteMutation.mutate(id);
			dialogRef.close();
		});
	}

	onDeleteLog(id: number): void
	{
		this.deleteMutation.mutate(id);
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
