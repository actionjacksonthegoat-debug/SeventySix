import { Injectable, inject } from "@angular/core";
import {
	injectQuery,
	CreateQueryResult
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import { ThirdPartyApiRepository } from "../repositories";
import { ThirdPartyApiRequest } from "../models";
import { getQueryConfig } from "@core/utils/query-config";

/**
 * Service for managing third-party API request data
 * Uses TanStack Query for caching and state management
 */
@Injectable({
	providedIn: "root"
})
export class ThirdPartyApiService
{
	private readonly repository: ThirdPartyApiRepository = inject(
		ThirdPartyApiRepository
	);

	private readonly queryConfig: ReturnType<typeof getQueryConfig> =
		getQueryConfig("thirdPartyApi");

	/**
	 * Creates a query for all third-party API requests
	 * Automatically cached with TanStack Query
	 * @returns Query object with data, isLoading, error, etc.
	 */
	createAllQuery(): CreateQueryResult<ThirdPartyApiRequest[], Error>
	{
		return injectQuery(() => ({
			queryKey: ["thirdPartyApi", "all"],
			queryFn: () => lastValueFrom(this.repository.getAll()),
			...this.queryConfig
		}));
	}

	/**
	 * Creates a query for third-party API requests filtered by API name
	 * @param apiName - The API name to filter by
	 * @returns Query object with data, isLoading, error, etc.
	 */
	createByApiNameQuery(
		apiName: string
	): CreateQueryResult<ThirdPartyApiRequest[], Error>
	{
		return injectQuery(() => ({
			queryKey: ["thirdPartyApi", "byName", apiName],
			queryFn: () => lastValueFrom(this.repository.getByApiName(apiName)),
			...this.queryConfig
		}));
	}

	/**
	 * Creates a query for third-party API statistics
	 * @returns Query object with data, isLoading, error, etc.
	 */
	createStatisticsQuery(): CreateQueryResult<Record<string, unknown>, Error>
	{
		return injectQuery(() => ({
			queryKey: ["thirdPartyApi", "statistics"],
			queryFn: () => lastValueFrom(this.repository.getStatistics()),
			...this.queryConfig
		}));
	}
}
