import { ADMIN_API_ENDPOINTS, SANDBOX_SOURCES } from "@admin/constants";
import { PagedResultOfLogDto } from "@admin/logs/models";
import { inject, Injectable } from "@angular/core";
import { ApiService } from "@shared/services/api.service";
import { DateService } from "@shared/services/date.service";
import { buildHttpParams } from "@shared/utilities/http-params.utility";
import { getQueryConfig } from "@shared/utilities/query-config.utility";
import {
	CreateQueryResult,
	injectQuery
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";

/**
 * Service for aggregating sandbox container health and log data.
 * Queries the log API with SourceContext filters for each sandbox.
 * Provided at route level for proper garbage collection (see admin.routes.ts).
 */
@Injectable()
export class SandboxDashboardService
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
	 * Query configuration for log-based queries.
	 * @type {ReturnType<typeof getQueryConfig>}
	 * @private
	 * @readonly
	 */
	private readonly queryConfig: ReturnType<typeof getQueryConfig> =
		getQueryConfig(ADMIN_API_ENDPOINTS.LOGS);

	/**
	 * Queries recent warning logs for the SvelteKit sandbox (last 24 hours).
	 * @returns {CreateQueryResult<PagedResultOfLogDto, Error>}
	 * TanStack Query result containing paged warning logs.
	 */
	getSvelteKitWarnings(): CreateQueryResult<PagedResultOfLogDto, Error>
	{
		return this.getLogsBySourceAndLevel(
			SANDBOX_SOURCES.SVELTEKIT,
			"Warning",
			"sveltekit-warnings");
	}

	/**
	 * Queries recent error logs for the SvelteKit sandbox (last 24 hours).
	 * @returns {CreateQueryResult<PagedResultOfLogDto, Error>}
	 * TanStack Query result containing paged error logs.
	 */
	getSvelteKitErrors(): CreateQueryResult<PagedResultOfLogDto, Error>
	{
		return this.getLogsBySourceAndLevel(
			SANDBOX_SOURCES.SVELTEKIT,
			"Error",
			"sveltekit-errors");
	}

	/**
	 * Queries recent warning logs for the TanStack sandbox (last 24 hours).
	 * @returns {CreateQueryResult<PagedResultOfLogDto, Error>}
	 * TanStack Query result containing paged warning logs.
	 */
	getTanStackWarnings(): CreateQueryResult<PagedResultOfLogDto, Error>
	{
		return this.getLogsBySourceAndLevel(
			SANDBOX_SOURCES.TANSTACK,
			"Warning",
			"tanstack-warnings");
	}

	/**
	 * Queries recent error logs for the TanStack sandbox (last 24 hours).
	 * @returns {CreateQueryResult<PagedResultOfLogDto, Error>}
	 * TanStack Query result containing paged error logs.
	 */
	getTanStackErrors(): CreateQueryResult<PagedResultOfLogDto, Error>
	{
		return this.getLogsBySourceAndLevel(
			SANDBOX_SOURCES.TANSTACK,
			"Error",
			"tanstack-errors");
	}

	/**
	 * Queries logs filtered by source context and log level for the last 24 hours.
	 * @param {string} sourceContext
	 * The source context identifier to filter by.
	 * @param {string} logLevel
	 * The log level to filter by (e.g., Warning, Error).
	 * @param {string} queryKeySuffix
	 * Unique suffix for the TanStack Query key.
	 * @returns {CreateQueryResult<PagedResultOfLogDto, Error>}
	 * TanStack Query result containing paged logs.
	 */
	private getLogsBySourceAndLevel(
		sourceContext: string,
		logLevel: string,
		queryKeySuffix: string): CreateQueryResult<PagedResultOfLogDto, Error>
	{
		const now: Date =
			this.dateService.parseUTC(this.dateService.now());
		const startDate: Date =
			this.dateService.addDays(now, -1);

		return injectQuery(
			() => ({
				queryKey: ["sandbox", queryKeySuffix] as const,
				queryFn: () =>
					lastValueFrom(
						this.apiService.get<PagedResultOfLogDto>(
							ADMIN_API_ENDPOINTS.LOGS,
							buildHttpParams(
								{
									sourceContext,
									logLevel,
									startDate,
									page: 1,
									pageSize: 1
								}))),
				...this.queryConfig
			}));
	}
}