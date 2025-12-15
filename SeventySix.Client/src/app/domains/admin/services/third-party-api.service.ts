import {
	ThirdPartyApiRequestResponse,
	ThirdPartyApiStatisticsResponse
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

@Injectable()
export class ThirdPartyApiService
{
	private readonly apiService: ApiService =
		inject(ApiService);
	private readonly queryConfig: ReturnType<typeof getQueryConfig> =
		getQueryConfig("thirdpartyrequests");
	private readonly endpoint: string = "thirdpartyrequests";

	getAllThirdPartyApis(): CreateQueryResult<ThirdPartyApiRequestResponse[], Error>
	{
		return injectQuery(
			() => ({
				queryKey: QueryKeys.thirdPartyApi.list,
				queryFn: () =>
					lastValueFrom(this.apiService.get<ThirdPartyApiRequestResponse[]>(this.endpoint)),
				...this.queryConfig
			}));
	}

	getByApiName(
		apiName: string): CreateQueryResult<ThirdPartyApiRequestResponse[], Error>
	{
		return injectQuery(
			() => ({
				queryKey: QueryKeys.thirdPartyApi.byName(apiName),
				queryFn: () =>
				{
					const encodedName: string =
						encodeURIComponent(apiName);
					return lastValueFrom(
						this.apiService.get<ThirdPartyApiRequestResponse[]>(`${this.endpoint}/${encodedName}`));
				},
				...this.queryConfig
			}));
	}

	getStatistics(): CreateQueryResult<ThirdPartyApiStatisticsResponse, Error>
	{
		return injectQuery(
			() => ({
				queryKey: QueryKeys.thirdPartyApi.statistics,
				queryFn: () =>
					lastValueFrom(
						this.apiService.get<ThirdPartyApiStatisticsResponse>(`${this.endpoint}/statistics`)),
				...this.queryConfig
			}));
	}
}
