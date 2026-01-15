import {
	ThirdPartyApiRequestDto,
	ThirdPartyApiStatisticsDto
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
 * Service to query third-party API requests and statistics.
 * Used by admin views to examine external API usage.
 */
@Injectable()
export class ThirdPartyApiService
{
	/**
	 * API service used to fetch third-party API data.
	 * @type {ApiService}
	 * @private
	 * @readonly
	 */
	private readonly apiService: ApiService =
		inject(ApiService);

	/**
	 * Default query configuration for third-party API queries.
	 * @type {ReturnType<typeof getQueryConfig>}
	 * @private
	 * @readonly
	 */
	private readonly queryConfig: ReturnType<typeof getQueryConfig> =
		getQueryConfig("thirdpartyrequests");

	/**
	 * REST endpoint path for third-party API requests.
	 * @type {string}
	 * @private
	 * @readonly
	 */
	private readonly endpoint: string = "thirdpartyrequests";

	/**
	 * Retrieves a list of third-party API requests.
	 * @returns {CreateQueryResult<ThirdPartyApiRequestDto[], Error>}
	 * CreateQueryResult with list of third-party API requests.
	 */
	getAllThirdPartyApis(): CreateQueryResult<ThirdPartyApiRequestDto[], Error>
	{
		return injectQuery(
			() => ({
				queryKey: QueryKeys.thirdPartyApi.list,
				queryFn: () =>
					lastValueFrom(this.apiService.get<ThirdPartyApiRequestDto[]>(
						this.endpoint)),
				...this.queryConfig
			}));
	}

	/**
	 * Retrieves requests filtered by API name.
	 * @param {string} apiName
	 * The name of the third-party API to filter by.
	 * @returns {CreateQueryResult<ThirdPartyApiRequestDto[], Error>}
	 * CreateQueryResult with filtered list of requests.
	 */
	getByApiName(
		apiName: string): CreateQueryResult<ThirdPartyApiRequestDto[], Error>
	{
		return injectQuery(
			() => ({
				queryKey: QueryKeys.thirdPartyApi.byName(apiName),
				queryFn: () =>
				{
					const encodedName: string =
						encodeURIComponent(apiName);
					return lastValueFrom(
						this.apiService.get<ThirdPartyApiRequestDto[]>(
							`${this.endpoint}/${encodedName}`));
				},
				...this.queryConfig
			}));
	}

	/**
	 * Retrieves aggregated statistics for third-party API usage.
	 * @returns {CreateQueryResult<ThirdPartyApiStatisticsDto, Error>}
	 * CreateQueryResult with aggregated statistics.
	 */
	getStatistics(): CreateQueryResult<ThirdPartyApiStatisticsDto, Error>
	{
		return injectQuery(
			() => ({
				queryKey: QueryKeys.thirdPartyApi.statistics,
				queryFn: () =>
					lastValueFrom(
						this.apiService.get<ThirdPartyApiStatisticsDto>(
							`${this.endpoint}/statistics`)),
				...this.queryConfig
			}));
	}
}
