import {
	Component,
	ChangeDetectionStrategy,
	input,
	output,
	effect,
	viewChild,
	Signal,
	AfterViewInit,
	InputSignal,
	OutputEmitterRef,
	computed
} from "@angular/core";
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
import { TableHeightDirective } from "@shared/directives";
import {
	LogDto,
	getLogLevelName,
	getLogLevelClassName,
	getRelativeTime,
	truncateText
} from "@admin/logs/models";
import { environment } from "@environments/environment";

/** Log with pre-computed display values for template performance. */
export interface ProcessedLog extends LogDto
{
	levelClass: string;
	levelName: string;
	relativeTime: string;
	truncatedMessage: string;
}

/** Log table component with sorting, pagination, and selection. */
@Component({
	selector: "app-log-table",
	imports: [
		MatTableModule,
		MatCheckboxModule,
		MatIconModule,
		MatButtonModule,
		MatTooltipModule,
		MatPaginatorModule,
		MatSortModule,
		ScrollingModule,
		TableHeightDirective
	],
	templateUrl: "./log-table.component.html",
	styleUrl: "./log-table.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogTableComponent implements AfterViewInit
{
	private static readonly MESSAGE_TRUNCATE_LENGTH: number = 100;

	// Inputs
	readonly logs: InputSignal<LogDto[]> = input<LogDto[]>([]);
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
	readonly logSelected: OutputEmitterRef<LogDto> = output<LogDto>();
	readonly deleteLog: OutputEmitterRef<number> = output<number>();
	readonly deleteSelected: OutputEmitterRef<number[]> = output<number[]>();
	readonly pageChange: OutputEmitterRef<number> = output<number>();
	readonly pageSizeChange: OutputEmitterRef<number> = output<number>();

	// Pre-computed logs for template performance (no method calls per CD cycle)
	readonly processedLogs: Signal<ProcessedLog[]> = computed(
		(): ProcessedLog[] =>
			this.logs().map(
				(log: LogDto): ProcessedLog => ({
					...log,
					levelClass: getLogLevelClassName(log.logLevel),
					levelName: getLogLevelName(log.logLevel),
					relativeTime: getRelativeTime(log.createDate),
					truncatedMessage: truncateText(
						log.message,
						LogTableComponent.MESSAGE_TRUNCATE_LENGTH
					)
				})
			)
	);

	// Table configuration
	readonly dataSource: MatTableDataSource<ProcessedLog> =
		new MatTableDataSource<ProcessedLog>([]);
	readonly selection: SelectionModel<ProcessedLog> =
		new SelectionModel<ProcessedLog>(true, []);
	readonly pageSizeOptions: number[] = environment.ui.tables.pageSizeOptions;
	readonly virtualScrollItemSize: number =
		environment.ui.tables.virtualScrollItemSize;

	readonly paginator: Signal<MatPaginator | undefined> =
		viewChild(MatPaginator);
	readonly sort: Signal<MatSort | undefined> = viewChild(MatSort);

	constructor()
	{
		// Update data source when processedLogs change
		effect(() =>
		{
			this.dataSource.data = this.processedLogs();
		});
	}

	ngAfterViewInit(): void
	{
		const paginatorInstance: MatPaginator | undefined = this.paginator();
		const sortInstance: MatSort | undefined = this.sort();
		if (paginatorInstance)
		{
			this.dataSource.paginator = paginatorInstance;
		}
		if (sortInstance)
		{
			this.dataSource.sort = sortInstance;
		}
	}

	onRowClick(log: ProcessedLog): void
	{
		this.logSelected.emit(log);
	}

	toggleSelection(log: ProcessedLog): void
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
			this.dataSource.data.forEach((log: ProcessedLog) =>
				this.selection.select(log)
			);
		}
	}

	isAllSelected(): boolean
	{
		const numSelected: number = this.selection.selected.length;
		const numRows: number = this.dataSource.data.length;
		return numSelected === numRows;
	}

	onDeleteLog(log: ProcessedLog): void
	{
		this.deleteLog.emit(log.id);
	}

	onDeleteSelected(): void
	{
		const selectedIds: number[] = this.selection.selected.map(
			(log: ProcessedLog) => log.id
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
}
