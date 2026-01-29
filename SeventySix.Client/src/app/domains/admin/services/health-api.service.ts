import { ADMIN_API_ENDPOINTS } from "@admin/constants";
import {
	HealthStatusResponse,
	RecurringJobStatusResponse
} from "@admin/models";
import { inject, Injectable } from "@angular/core";
import { ApiService } from "@shared/services/api.service";
import { getQueryConfig } from "@shared/utilities/query-config.utility";
import { QueryKeys } from "@shared/utilities/query-keys.utility";
import {
	CreateQueryResult,
	injectQuery
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
	 * @private
	 * @readonly
	 */
	private readonly apiService: ApiService =
		inject(ApiService);

	/**
	 * Default query configuration for health queries.
	 * @type {ReturnType<typeof getQueryConfig>}
	 * @private
	 * @readonly
	 */
	private readonly queryConfig: ReturnType<typeof getQueryConfig> =
		getQueryConfig(ADMIN_API_ENDPOINTS.HEALTH);

	/**
	 * API endpoint path for health checks.
	 * @type {string}
	 * @private
	 * @readonly
	 */
	private readonly endpoint: string =
		ADMIN_API_ENDPOINTS.HEALTH;

	/**
	 * Retrieves minimal public health status.
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
	 * Retrieves comprehensive health status with infrastructure details.
	 * Includes database, external APIs, error queue, and system resources.
	 * Requires Developer or Admin role.
	 * @returns {CreateQueryResult<HealthStatusResponse, Error>}
	 * CreateQueryResult for detailed health status response.
	 */
	getDetailedHealth(): CreateQueryResult<HealthStatusResponse, Error>
	{
		return injectQuery(
			() => ({
				queryKey: QueryKeys.health.detailed,
				queryFn: () =>
					lastValueFrom(this.apiService.get<HealthStatusResponse>(
						`${this.endpoint}/detailed`)),
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
