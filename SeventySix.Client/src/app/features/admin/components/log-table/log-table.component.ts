import {
	Component,
	ChangeDetectionStrategy,
	input,
	output,
	effect,
	ViewChild,
	AfterViewInit
} from "@angular/core";
import { NgClass } from "@angular/common";
import { MatTableModule, MatTableDataSource } from "@angular/material/table";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import {
	MatPaginatorModule,
	MatPaginator,
	PageEvent
} from "@angular/material/paginator";
import { MatSortModule, MatSort } from "@angular/material/sort";
import { SelectionModel } from "@angular/cdk/collections";
import { LogResponse, LogLevel } from "@core/models/logs";

/**
 * Log table component with sorting, pagination, and selection
 */
@Component({
	selector: "app-log-table",
	imports: [
		NgClass,
		MatTableModule,
		MatCheckboxModule,
		MatIconModule,
		MatButtonModule,
		MatTooltipModule,
		MatPaginatorModule,
		MatSortModule
	],
	templateUrl: "./log-table.component.html",
	styleUrl: "./log-table.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogTableComponent implements AfterViewInit
{
	// Inputs
	logs = input<LogResponse[]>([]);
	totalCount = input<number>(0);
	pageSize = input<number>(50);
	pageIndex = input<number>(0);

	// Outputs
	logSelected = output<LogResponse>();
	deleteLog = output<number>();
	deleteSelected = output<number[]>();
	pageChange = output<number>();
	pageSizeChange = output<number>();

	// Table configuration
	displayedColumns = [
		"select",
		"level",
		"timestamp",
		"message",
		"sourceContext",
		"requestPath",
		"actions"
	];

	dataSource = new MatTableDataSource<LogResponse>([]);
	selection = new SelectionModel<LogResponse>(true, []);
	pageSizeOptions = [25, 50, 100];

	@ViewChild(MatPaginator) paginator!: MatPaginator;
	@ViewChild(MatSort) sort!: MatSort;

	constructor()
	{
		// Update data source when logs change
		effect(() =>
		{
			this.dataSource.data = this.logs();
		});
	}

	ngAfterViewInit(): void
	{
		this.dataSource.paginator = this.paginator;
		this.dataSource.sort = this.sort;
	}

	onRowClick(log: LogResponse): void
	{
		this.logSelected.emit(log);
	}

	toggleSelection(log: LogResponse): void
	{
		this.selection.toggle(log);
	}

	selectAll(): void
	{
		if (this.isAllSelected())
		{
			this.selection.clear();
		}
		else
		{
			this.dataSource.data.forEach((log) => this.selection.select(log));
		}
	}

	isAllSelected(): boolean
	{
		const numSelected = this.selection.selected.length;
		const numRows = this.dataSource.data.length;
		return numSelected === numRows && numRows > 0;
	}

	onDeleteLog(log: LogResponse): void
	{
		this.deleteLog.emit(log.id);
	}

	onDeleteSelected(): void
	{
		const selectedIds = this.selection.selected.map((log) => log.id);
		if (selectedIds.length > 0)
		{
			this.deleteSelected.emit(selectedIds);
			this.selection.clear();
		}
	}

	onPageChange(event: PageEvent): void
	{
		if (event.pageSize !== this.pageSize())
		{
			this.pageSizeChange.emit(event.pageSize);
		}
		this.pageChange.emit(event.pageIndex + 1);
	}

	getLevelName(level: LogLevel): string
	{
		const names: Record<LogLevel, string> = {
			[LogLevel.Verbose]: "Verbose",
			[LogLevel.Debug]: "Debug",
			[LogLevel.Information]: "Info",
			[LogLevel.Warning]: "Warning",
			[LogLevel.Error]: "Error",
			[LogLevel.Fatal]: "Fatal"
		};
		return names[level];
	}

	getLevelClass(level: LogLevel): string
	{
		const classes: Record<LogLevel, string> = {
			[LogLevel.Verbose]: "level-verbose",
			[LogLevel.Debug]: "level-debug",
			[LogLevel.Information]: "level-info",
			[LogLevel.Warning]: "level-warning",
			[LogLevel.Error]: "level-error",
			[LogLevel.Fatal]: "level-fatal"
		};
		return classes[level];
	}

	getRelativeTime(date: Date): string
	{
		const now = Date.now();
		const diff = now - date.getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (days > 0)
		{
			return `${days} day${days > 1 ? "s" : ""} ago`;
		}
		if (hours > 0)
		{
			return `${hours} hour${hours > 1 ? "s" : ""} ago`;
		}
		if (minutes > 0)
		{
			return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
		}
		return "just now";
	}

	truncateMessage(message: string, maxLength: number): string
	{
		if (message.length <= maxLength)
		{
			return message;
		}
		return message.substring(0, maxLength) + "...";
	}
}
