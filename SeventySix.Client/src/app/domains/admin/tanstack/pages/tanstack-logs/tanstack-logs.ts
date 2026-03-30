import { PagedResultOfLogDto } from "@admin/logs/models";
import { TanStackLogService } from "@admin/tanstack/services";
import { DatePipe } from "@angular/common";
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	Signal
} from "@angular/core";
import { MatPaginatorModule, PageEvent } from "@angular/material/paginator";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { PageHeaderComponent } from "@shared/components";
import { CARD_MATERIAL_MODULES } from "@shared/material-bundles.constants";
import { CreateQueryResult } from "@tanstack/angular-query-experimental";

/**
 * TanStack admin logs page.
 * Displays paginated, filterable log entries from the TanStack sandbox.
 */
@Component(
	{
		selector: "app-tanstack-logs",
		imports: [
			PageHeaderComponent,
			MatProgressSpinnerModule,
			MatSelectModule,
			MatPaginatorModule,
			DatePipe,
			...CARD_MATERIAL_MODULES
		],
		templateUrl: "./tanstack-logs.html",
		styleUrl: "./tanstack-logs.scss",
		changeDetection: ChangeDetectionStrategy.OnPush
	})
export class TanStackLogsPage
{
	/**
	 * Log service for TanStack log data.
	 * @type {TanStackLogService}
	 * @private
	 * @readonly
	 */
	private readonly logService: TanStackLogService =
		inject(TanStackLogService);

	/**
	 * Query result for paged TanStack logs.
	 * @type {CreateQueryResult<PagedResultOfLogDto, Error>}
	 * @readonly
	 */
	readonly logsQuery: CreateQueryResult<PagedResultOfLogDto, Error> =
		this.logService.getPagedLogs();

	/**
	 * Whether the log query is loading.
	 * @type {Signal<boolean>}
	 * @readonly
	 */
	readonly isLoading: Signal<boolean> =
		computed(
			() => this.logsQuery.isLoading());

	/**
	 * Total count of log entries.
	 * @type {Signal<number>}
	 * @readonly
	 */
	readonly totalCount: Signal<number> =
		computed(
			() =>
				this.logsQuery.data()?.totalCount ?? 0);

	/**
	 * Current page size.
	 * @type {Signal<number>}
	 * @readonly
	 */
	readonly pageSize: Signal<number> =
		this.logService.pageSize;

	/**
	 * Current page index (zero-based).
	 * @type {Signal<number>}
	 * @readonly
	 */
	readonly pageIndex: Signal<number> =
		computed(
			() => this.logService.currentPage() - 1);

	/**
	 * Available log level filter options.
	 * @type {readonly string[]}
	 * @readonly
	 */
	readonly logLevels: readonly string[] =
		["", "Trace", "Debug", "Information", "Warning", "Error", "Critical"];

	/**
	 * Current log level filter value.
	 * @type {Signal<string>}
	 * @readonly
	 */
	readonly currentLevel: Signal<string> =
		this.logService.logLevelFilter;

	/**
	 * Handles paginator page change events.
	 * @param {PageEvent} event - The page event from mat-paginator.
	 */
	onPageChange(event: PageEvent): void
	{
		this.logService.pageSize.set(event.pageSize);
		this.logService.goToPage(event.pageIndex + 1);
	}

	/**
	 * Handles log level filter changes.
	 * @param {string} level - The selected log level.
	 */
	onLevelChange(level: string): void
	{
		this.logService.setLevelFilter(level);
	}
}