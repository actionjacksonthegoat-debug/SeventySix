import { ADMIN_API_ENDPOINTS, SANDBOX_SOURCES } from "@admin/constants";
import { PagedResultOfLogDto } from "@admin/logs/models";
import {
	SVELTE_DASHBOARD_UIDS
} from "@admin/svelte/constants";
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
 * Service for SvelteKit dashboard data and Grafana URL management.
 * Queries log API with SvelteKit source context for warning/error counts.
 * Provides Grafana dashboard UIDs for iframe embedding.
 */
@Injectable()
export class SvelteDashboardService
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
	 * Returns the Grafana dashboard UID for the specified dashboard type.
	 * @param {("performance" | "commerce")} dashboardType
	 * The type of dashboard to retrieve.
	 * @returns {string}
	 * The Grafana dashboard UID.
	 */
	getDashboardUid(dashboardType: "performance" | "commerce"): string
	{
		return dashboardType === "performance"
			? SVELTE_DASHBOARD_UIDS.PERFORMANCE
			: SVELTE_DASHBOARD_UIDS.COMMERCE;
	}

	/**
	 * Queries recent warning logs for SvelteKit (last 24 hours).
	 * @returns {CreateQueryResult<PagedResultOfLogDto, Error>}
	 * TanStack Query result containing paged warning logs.
	 */
	getWarnings(): CreateQueryResult<PagedResultOfLogDto, Error>
	{
		return this.getLogsByLevel("Warning", "svelte-dashboard-warnings");
	}

	/**
	 * Queries recent error logs for SvelteKit (last 24 hours).
	 * @returns {CreateQueryResult<PagedResultOfLogDto, Error>}
	 * TanStack Query result containing paged error logs.
	 */
	getErrors(): CreateQueryResult<PagedResultOfLogDto, Error>
	{
		return this.getLogsByLevel("Error", "svelte-dashboard-errors");
	}

	/**
	 * Queries logs filtered by log level for SvelteKit source context.
	 * @param {string} logLevel
	 * The log level to filter by (e.g., Warning, Error).
	 * @param {string} queryKeySuffix
	 * Unique suffix for the TanStack Query key.
	 * @returns {CreateQueryResult<PagedResultOfLogDto, Error>}
	 * TanStack Query result containing paged logs.
	 */
	private getLogsByLevel(
		logLevel: string,
		queryKeySuffix: string): CreateQueryResult<PagedResultOfLogDto, Error>
	{
		const now: Date =
			this.dateService.parseUTC(this.dateService.now());
		const startDate: Date =
			this.dateService.addDays(now, -1);

		return injectQuery(
			() => ({
				queryKey: ["svelte-admin", queryKeySuffix] as const,
				queryFn: () =>
					lastValueFrom(
						this.apiService.get<PagedResultOfLogDto>(
							ADMIN_API_ENDPOINTS.LOGS,
							buildHttpParams(
								{
									sourceContext: SANDBOX_SOURCES.SVELTEKIT,
									logLevel,
									startDate,
									page: 1,
									pageSize: 1
								}))),
				...this.queryConfig
			}));
	}
}