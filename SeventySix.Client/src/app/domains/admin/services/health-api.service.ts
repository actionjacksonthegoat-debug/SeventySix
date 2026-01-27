import { ADMIN_API_ENDPOINTS } from "@admin/constants";
import {
	DatabaseHealthResponse,
	ExternalApiHealthResponse,
	HealthStatusResponse,
	RecurringJobStatusResponse
} from "@admin/models";
import { inject, Injectable } from "@angular/core";
import { ApiService } from "@shared/services/api.service";
import { getQueryConfig } from "@shared/utilities/query-config.utility";
import { QueryKeys } from "@shared/utilities/query-keys.utility";
import {
	CreateQueryResult,
	injectQuery,
	QueryClient
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";

/**
 * Provides health check queries for system, database, and external APIs.
 * Used by admin UI to display service status.
 */
@Injectable()
export class HealthApiService
{
	/**
	 * HTTP API service used to request health endpoints.
	 * @type {ApiService}
	 */
	private readonly apiService: ApiService =
		inject(ApiService);

	/**
	 * Query client used to manage server-state queries.
	 * @type {QueryClient}
	 */
	private readonly queryClient: QueryClient =
		inject(QueryClient);

	/**
	 * Default query configuration for health queries.
	 * @type {ReturnType<typeof getQueryConfig>}
	 */
	private readonly queryConfig: ReturnType<typeof getQueryConfig> =
		getQueryConfig(ADMIN_API_ENDPOINTS.HEALTH);

	/**
	 * API endpoint path for health checks.
	 * @type {string}
	 */
	private readonly endpoint: string =
		ADMIN_API_ENDPOINTS.HEALTH;

	/**
	 * Retrieves overall health status.
	 * @returns {CreateQueryResult<HealthStatusResponse, Error>}
	 * CreateQueryResult for health status response.
	 */
	getHealth(): CreateQueryResult<HealthStatusResponse, Error>
	{
		return injectQuery(
			() => ({
				queryKey: QueryKeys.health.status,
				queryFn: () =>
					lastValueFrom(this.apiService.get<HealthStatusResponse>(
						this.endpoint)),
				...this.queryConfig
			}));
	}

	/**
	 * Retrieves database health details.
	 * @returns {CreateQueryResult<DatabaseHealthResponse, Error>}
	 * CreateQueryResult for database health response.
	 */
	getDatabaseHealth(): CreateQueryResult<DatabaseHealthResponse, Error>
	{
		return injectQuery(
			() => ({
				queryKey: QueryKeys.health.database,
				queryFn: () =>
					lastValueFrom(this.apiService.get<DatabaseHealthResponse>(
						`${this.endpoint}/database`)),
				...this.queryConfig
			}));
	}

	/**
	 * Retrieves health status for external third-party APIs.
	 * @returns {CreateQueryResult<ExternalApiHealthResponse, Error>}
	 * CreateQueryResult for external API health response.
	 */
	getExternalApiHealth(): CreateQueryResult<ExternalApiHealthResponse, Error>
	{
		return injectQuery(
			() => ({
				queryKey: QueryKeys.health.externalApis,
				queryFn: () =>
					lastValueFrom(this.apiService.get<ExternalApiHealthResponse>(
						`${this.endpoint}/external-apis`)),
				...this.queryConfig
			}));
	}

	/**
	 * Retrieves scheduled background job statuses.
	 * @returns {CreateQueryResult<RecurringJobStatusResponse[], Error>}
	 * CreateQueryResult for scheduled job status responses.
	 */
	getScheduledJobs(): CreateQueryResult<RecurringJobStatusResponse[], Error>
	{
		return injectQuery(
			() => ({
				queryKey: QueryKeys.health.scheduledJobs,
				queryFn: () =>
					lastValueFrom(this.apiService.get<RecurringJobStatusResponse[]>(
						`${this.endpoint}/scheduled-jobs`)),
				...this.queryConfig
			}));
	}
}
