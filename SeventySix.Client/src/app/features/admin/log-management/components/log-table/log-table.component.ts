import {
	Component,
	ChangeDetectionStrategy,
	input,
	output,
	effect,
	ViewChild,
	AfterViewInit,
	InputSignal,
	OutputEmitterRef
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
import { ScrollingModule } from "@angular/cdk/scrolling";
import {
	LogResponse,
	LogLevel,
	parseLogLevel
} from "@admin/log-management/models";
import { environment } from "@environments/environment";

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
		MatSortModule,
		ScrollingModule
	],
	templateUrl: "./log-table.component.html",
	styleUrl: "./log-table.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogTableComponent implements AfterViewInit
{
	// Inputs
	readonly logs: InputSignal<LogResponse[]> = input<LogResponse[]>([]);
	readonly totalCount: InputSignal<number> = input<number>(0);
	readonly pageSize: InputSignal<number> = input<number>(
		environment.ui.tables.defaultPageSize
	);
	readonly pageIndex: InputSignal<number> = input<number>(0);
	readonly displayedColumns: InputSignal<string[]> = input<string[]>([
		"select",
		"level",
		"timestamp",
		"message",
		"sourceContext",
		"requestPath",
		"actions"
	]);

	// Outputs
	readonly logSelected: OutputEmitterRef<LogResponse> = output<LogResponse>();
	readonly deleteLog: OutputEmitterRef<number> = output<number>();
	readonly deleteSelected: OutputEmitterRef<number[]> = output<number[]>();
	readonly pageChange: OutputEmitterRef<number> = output<number>();
	readonly pageSizeChange: OutputEmitterRef<number> = output<number>();

	// Table configuration

	readonly dataSource: MatTableDataSource<LogResponse> =
		new MatTableDataSource<LogResponse>([]);
	readonly selection: SelectionModel<LogResponse> =
		new SelectionModel<LogResponse>(true, []);
	readonly pageSizeOptions: number[] = environment.ui.tables.pageSizeOptions;
	readonly virtualScrollItemSize: number =
		environment.ui.tables.virtualScrollItemSize;

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
		const numSelected: number = this.selection.selected.length;
		const numRows: number = this.dataSource.data.length;
		return numSelected === numRows;
	}

	onDeleteLog(log: LogResponse): void
	{
		this.deleteLog.emit(log.id);
	}

	onDeleteSelected(): void
	{
		const selectedIds: number[] = this.selection.selected.map(
			(log) => log.id
		);
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

	getLevelName(logLevel: string): string
	{
		const level: LogLevel = parseLogLevel(logLevel);
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

	getLevelClass(logLevel: string): string
	{
		const level: LogLevel = parseLogLevel(logLevel);
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

	getRelativeTime(date: Date | string): string
	{
		const dateObj: Date = typeof date === "string" ? new Date(date) : date;
		const now: number = Date.now();
		const diff: number = now - dateObj.getTime();
		const minutes: number = Math.floor(diff / 60000);
		const hours: number = Math.floor(diff / 3600000);
		const days: number = Math.floor(diff / 86400000);

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
