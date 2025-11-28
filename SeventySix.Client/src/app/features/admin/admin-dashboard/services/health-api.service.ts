import { Injectable, inject } from "@angular/core";
import {
	injectQuery,
	QueryClient,
	CreateQueryResult
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import { HealthApiRepository } from "../repositories";
import { HealthStatus, DatabaseHealth, ExternalApiHealth } from "../models";
import { getQueryConfig } from "@infrastructure/utils/query-config";

@Injectable()
export class HealthApiService
{
	private readonly repository: HealthApiRepository =
		inject(HealthApiRepository);
	private readonly queryClient: QueryClient = inject(QueryClient);
	private readonly queryConfig: ReturnType<typeof getQueryConfig> =
		getQueryConfig("health");

	/**
	 * Gets overall system health status
	 * Automatically cached with TanStack Query
	 * @returns Query object with data, isLoading, error, etc.
	 */
	getHealth(): CreateQueryResult<HealthStatus, Error>
	{
		return injectQuery(() => ({
			queryKey: ["health", "status"],
			queryFn: () => lastValueFrom(this.repository.getHealth()),
			...this.queryConfig
		}));
	}

	/**
	 * Gets database health status
	 * @returns Query object with data, isLoading, error, etc.
	 */
	getDatabaseHealth(): CreateQueryResult<DatabaseHealth, Error>
	{
		return injectQuery(() => ({
			queryKey: ["health", "database"],
			queryFn: () => lastValueFrom(this.repository.getDatabaseHealth()),
			...this.queryConfig
		}));
	}

	/**
	 * Gets external API health status
	 * @returns Query object with data, isLoading, error, etc.
	 */
	getExternalApiHealth(): CreateQueryResult<ExternalApiHealth, Error>
	{
		return injectQuery(() => ({
			queryKey: ["health", "externalApis"],
			queryFn: () =>
				lastValueFrom(this.repository.getExternalApiHealth()),
			...this.queryConfig
		}));
	}
}
