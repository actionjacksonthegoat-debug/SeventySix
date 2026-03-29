import { PagedResultOfLogDto } from "@admin/logs/models";
import { SvelteLogService } from "@admin/svelte/services";
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
 * SvelteKit logs viewer page.
 * Displays read-only paged logs filtered to SvelteKit source context.
 * Supports log level filtering and pagination.
 */
@Component(
	{
		selector: "app-svelte-logs",
		imports: [
			PageHeaderComponent,
			MatProgressSpinnerModule,
			MatSelectModule,
			MatPaginatorModule,
			DatePipe,
			...CARD_MATERIAL_MODULES
		],
		templateUrl: "./svelte-logs.html",
		styleUrl: "./svelte-logs.scss",
		changeDetection: ChangeDetectionStrategy.OnPush
	})
export class SvelteLogsPage
{
	/**
	 * Log service for querying SvelteKit-specific logs.
	 * @type {SvelteLogService}
	 * @private
	 * @readonly
	 */
	private readonly logService: SvelteLogService =
		inject(SvelteLogService);

	/**
	 * Query result for paged logs.
	 * @type {CreateQueryResult<PagedResultOfLogDto, Error>}
	 * @readonly
	 */
	readonly logsQuery: CreateQueryResult<PagedResultOfLogDto, Error> =
		this.logService.getPagedLogs();

	/**
	 * Whether the query is loading.
	 * @type {Signal<boolean>}
	 * @readonly
	 */
	readonly isLoading: Signal<boolean> =
		computed(
			() => this.logsQuery.isLoading());

	/**
	 * Total count of logs for paginator.
	 * @type {Signal<number>}
	 * @readonly
	 */
	readonly totalCount: Signal<number> =
		computed(
			() =>
				this.logsQuery.data()?.totalCount ?? 0);

	/**
	 * Current page size for paginator binding.
	 * @type {Signal<number>}
	 * @readonly
	 */
	readonly pageSize: Signal<number> =
		this.logService.pageSize;

	/**
	 * Current page index (0-based) for paginator binding.
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
	 * @param {PageEvent} event
	 * The pagination event containing new page index and size.
	 * @returns {void}
	 */
	onPageChange(event: PageEvent): void
	{
		this.logService.pageSize.set(event.pageSize);
		this.logService.goToPage(event.pageIndex + 1);
	}

	/**
	 * Handles log level filter change.
	 * @param {string} level
	 * The selected log level.
	 * @returns {void}
	 */
	onLevelChange(level: string): void
	{
		this.logService.setLevelFilter(level);
	}
}