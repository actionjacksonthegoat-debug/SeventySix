import { ADMIN_API_ENDPOINTS, SANDBOX_SOURCES } from "@admin/constants";
import { PagedResultOfLogDto } from "@admin/logs/models";
import { inject, Injectable } from "@angular/core";
import { signal, WritableSignal } from "@angular/core";
import { ApiService } from "@shared/services/api.service";
import { DateService } from "@shared/services/date.service";
import { buildHttpParams } from "@shared/utilities/http-params.utility";
import { getQueryConfig } from "@shared/utilities/query-config.utility";
import {
	CreateQueryResult,
	injectQuery,
	keepPreviousData
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";

/**
 * Service for querying TanStack-specific logs.
 * Always filters by TanStack source context. Read-only — no delete/create.
 */
@Injectable()
export class TanStackLogService
{
	/**
	 * API service for HTTP requests.
	 * @type {ApiService}
	 * @private
	 * @readonly
	 */
	private readonly apiService: ApiService =
		inject(ApiService);

	/**
	 * Date handling service for UTC date operations.
	 * @type {DateService}
	 * @private
	 * @readonly
	 */
	private readonly dateService: DateService =
		inject(DateService);

	/**
	 * Query configuration for log queries.
	 * @type {ReturnType<typeof getQueryConfig>}
	 * @private
	 * @readonly
	 */
	private readonly queryConfig: ReturnType<typeof getQueryConfig> =
		getQueryConfig(ADMIN_API_ENDPOINTS.LOGS);

	/**
	 * Current page number for pagination.
	 * @type {WritableSignal<number>}
	 * @readonly
	 */
	readonly currentPage: WritableSignal<number> =
		signal<number>(1);

	/**
	 * Current page size for pagination.
	 * @type {WritableSignal<number>}
	 * @readonly
	 */
	readonly pageSize: WritableSignal<number> =
		signal<number>(25);

	/**
	 * Current log level filter.
	 * @type {WritableSignal<string>}
	 * @readonly
	 */
	readonly logLevelFilter: WritableSignal<string> =
		signal<string>("");

	/**
	 * Queries paged logs filtered to TanStack source context.
	 * @returns {CreateQueryResult<PagedResultOfLogDto, Error>}
	 * TanStack Query result containing paged logs.
	 */
	getPagedLogs(): CreateQueryResult<PagedResultOfLogDto, Error>
	{
		return injectQuery(
			() =>
			{
				const params: Record<string, unknown> =
					{
						sourceContext: SANDBOX_SOURCES.TANSTACK,
						page: this.currentPage(),
						pageSize: this.pageSize()
					};
				const level: string =
					this.logLevelFilter();
				if (level !== "")
				{
					params["logLevel"] = level;
				}

				return {
					queryKey: [
						"tanstack-logs",
						this.currentPage(),
						this.pageSize(),
						level
					] as const,
					queryFn: () =>
						lastValueFrom(
							this.apiService.get<PagedResultOfLogDto>(
								ADMIN_API_ENDPOINTS.LOGS,
								buildHttpParams(params))),
					placeholderData: keepPreviousData,
					...this.queryConfig
				};
			});
	}

	/**
	 * Navigates to the specified page number.
	 * @param {number} page
	 * The page number to navigate to (1-based).
	 * @returns {void}
	 */
	goToPage(page: number): void
	{
		this.currentPage.set(page);
	}

	/**
	 * Sets the log level filter value.
	 * @param {string} level
	 * The log level to filter by (empty string for all levels).
	 * @returns {void}
	 */
	setLevelFilter(level: string): void
	{
		this.logLevelFilter.set(level);
		this.currentPage.set(1);
	}
}