import {
	DatabaseHealthResponse,
	ExternalApiHealthResponse,
	HealthStatusResponse
} from "@admin/models";
import { inject, Injectable } from "@angular/core";
import { ApiService } from "@shared/services/api.service";
import { getQueryConfig } from "@shared/utilities/query-config";
import { QueryKeys } from "@shared/utilities/query-keys";
import {
	CreateQueryResult,
	injectQuery,
	QueryClient
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";

@Injectable()
export class HealthApiService
{
	private readonly apiService: ApiService =
		inject(ApiService);
	private readonly queryClient: QueryClient =
		inject(QueryClient);
	private readonly queryConfig: ReturnType<typeof getQueryConfig> =
		getQueryConfig("health");
	private readonly endpoint: string = "health";

	getHealth(): CreateQueryResult<HealthStatusResponse, Error>
	{
		return injectQuery(
			() => ({
				queryKey: QueryKeys.health.status,
				queryFn: () =>
					lastValueFrom(this.apiService.get<HealthStatusResponse>(this.endpoint)),
				...this.queryConfig
			}));
	}

	getDatabaseHealth(): CreateQueryResult<DatabaseHealthResponse, Error>
	{
		return injectQuery(
			() => ({
				queryKey: QueryKeys.health.database,
				queryFn: () =>
					lastValueFrom(this.apiService.get<DatabaseHealthResponse>(`${this.endpoint}/database`)),
				...this.queryConfig
			}));
	}

	getExternalApiHealth(): CreateQueryResult<ExternalApiHealthResponse, Error>
	{
		return injectQuery(
			() => ({
				queryKey: QueryKeys.health.externalApis,
				queryFn: () =>
					lastValueFrom(this.apiService.get<ExternalApiHealthResponse>(`${this.endpoint}/external-apis`)),
				...this.queryConfig
			}));
	}
}
