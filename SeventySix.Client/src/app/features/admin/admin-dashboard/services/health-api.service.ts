import { Injectable, inject } from "@angular/core";
import {
	injectQuery,
	QueryClient,
	CreateQueryResult
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import { HealthApiRepository } from "../repositories";
import { HealthStatus } from "../models";
import { getQueryConfig } from "@core/utils/query-config";

/**
 * Service for managing health check data
 * Uses TanStack Query for caching and state management
 */
@Injectable({
	providedIn: "root"
})
export class HealthApiService
{
	private readonly repository: HealthApiRepository =
		inject(HealthApiRepository);
	private readonly queryClient: QueryClient = inject(QueryClient);
	private readonly queryConfig: ReturnType<typeof getQueryConfig> =
		getQueryConfig("health");

	/**
	 * Creates a query for overall system health status
	 * Automatically cached with TanStack Query
	 * @returns Query object with data, isLoading, error, etc.
	 */
	createHealthQuery(): CreateQueryResult<HealthStatus, Error>
	{
		return injectQuery(() => ({
			queryKey: ["health", "status"],
			queryFn: () => lastValueFrom(this.repository.getHealth()),
			...this.queryConfig
		}));
	}

	/**
	 * Creates a query for database health status
	 * @returns Query object with data, isLoading, error, etc.
	 */
	createDatabaseHealthQuery(): CreateQueryResult<HealthStatus, Error>
	{
		return injectQuery(() => ({
			queryKey: ["health", "database"],
			queryFn: () => lastValueFrom(this.repository.getDatabaseHealth()),
			...this.queryConfig
		}));
	}

	/**
	 * Creates a query for external API health status
	 * @returns Query object with data, isLoading, error, etc.
	 */
	createExternalApiHealthQuery(): CreateQueryResult<HealthStatus, Error>
	{
		return injectQuery(() => ({
			queryKey: ["health", "externalApis"],
			queryFn: () =>
				lastValueFrom(this.repository.getExternalApiHealth()),
			...this.queryConfig
		}));
	}
}
