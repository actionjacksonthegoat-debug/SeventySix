import { Injectable, inject } from "@angular/core";
import {
	injectQuery,
	QueryClient,
	CreateQueryResult
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import { ApiService } from "@infrastructure/api-services/api.service";
import {
	HealthStatusResponse,
	DatabaseHealthResponse,
	ExternalApiHealthResponse
} from "@admin/admin-dashboard/models";
import { getQueryConfig } from "@infrastructure/utils/query-config";
import { QueryKeys } from "@infrastructure/utils/query-keys";

@Injectable()
export class HealthApiService
{
	private readonly apiService: ApiService = inject(ApiService);
	private readonly queryClient: QueryClient = inject(QueryClient);
	private readonly queryConfig: ReturnType<typeof getQueryConfig> =
		getQueryConfig("health");
	private readonly endpoint: string = "health";

	getHealth(): CreateQueryResult<HealthStatusResponse, Error>
	{
		return injectQuery(() => ({
			queryKey: QueryKeys.health.status,
			queryFn: () =>
				lastValueFrom(this.apiService.get<HealthStatusResponse>(this.endpoint)),
			...this.queryConfig
		}));
	}

	getDatabaseHealth(): CreateQueryResult<DatabaseHealthResponse, Error>
	{
		return injectQuery(() => ({
			queryKey: QueryKeys.health.database,
			queryFn: () =>
				lastValueFrom(this.apiService.get<DatabaseHealthResponse>(`${this.endpoint}/database`)),
			...this.queryConfig
		}));
	}

	getExternalApiHealth(): CreateQueryResult<ExternalApiHealthResponse, Error>
	{
		return injectQuery(() => ({
			queryKey: QueryKeys.health.externalApis,
			queryFn: () =>
				lastValueFrom(this.apiService.get<ExternalApiHealthResponse>(`${this.endpoint}/external-apis`)),
			...this.queryConfig
		}));
	}
}
