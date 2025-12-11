import { Injectable, inject } from "@angular/core";
import {
	injectQuery,
	CreateQueryResult
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import { ThirdPartyApiRepository } from "@admin/admin-dashboard/repositories";
import {
	ThirdPartyApiRequestResponse,
	ThirdPartyApiStatisticsResponse
} from "@admin/admin-dashboard/models";
import { getQueryConfig } from "@infrastructure/utils/query-config";
import { QueryKeys } from "@infrastructure/utils/query-keys";

@Injectable()
export class ThirdPartyApiService
{
	private readonly repository: ThirdPartyApiRepository = inject(
		ThirdPartyApiRepository
	);
	private readonly queryConfig: ReturnType<typeof getQueryConfig> =
		getQueryConfig("thirdpartyrequests");

	getAllThirdPartyApis(): CreateQueryResult<ThirdPartyApiRequestResponse[], Error>
	{
		return injectQuery(() => ({
			queryKey: QueryKeys.thirdPartyApi.list,
			queryFn: () => lastValueFrom(this.repository.getAll()),
			...this.queryConfig
		}));
	}

	getByApiName(
		apiName: string
	): CreateQueryResult<ThirdPartyApiRequestResponse[], Error>
	{
		return injectQuery(() => ({
			queryKey: QueryKeys.thirdPartyApi.byName(apiName),
			queryFn: () => lastValueFrom(this.repository.getByApiName(apiName)),
			...this.queryConfig
		}));
	}

	getStatistics(): CreateQueryResult<ThirdPartyApiStatisticsResponse, Error>
	{
		return injectQuery(() => ({
			queryKey: QueryKeys.thirdPartyApi.statistics,
			queryFn: () => lastValueFrom(this.repository.getStatistics()),
			...this.queryConfig
		}));
	}
}
