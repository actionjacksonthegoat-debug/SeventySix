import { Injectable, inject } from "@angular/core";
import {
	injectQuery,
	QueryClient,
	CreateQueryResult
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import { HealthApiRepository } from "@admin/admin-dashboard/repositories";
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
	private readonly repository: HealthApiRepository =
		inject(HealthApiRepository);
	private readonly queryClient: QueryClient = inject(QueryClient);
	private readonly queryConfig: ReturnType<typeof getQueryConfig> =
		getQueryConfig("health");

	getHealth(): CreateQueryResult<HealthStatusResponse, Error>
	{
		return injectQuery(() => ({
			queryKey: QueryKeys.health.status,
			queryFn: () => lastValueFrom(this.repository.getHealth()),
			...this.queryConfig
		}));
	}

	getDatabaseHealth(): CreateQueryResult<DatabaseHealthResponse, Error>
	{
		return injectQuery(() => ({
			queryKey: QueryKeys.health.database,
			queryFn: () => lastValueFrom(this.repository.getDatabaseHealth()),
			...this.queryConfig
		}));
	}

	getExternalApiHealth(): CreateQueryResult<ExternalApiHealthResponse, Error>
	{
		return injectQuery(() => ({
			queryKey: QueryKeys.health.externalApis,
			queryFn: () =>
				lastValueFrom(this.repository.getExternalApiHealth()),
			...this.queryConfig
		}));
	}
}
