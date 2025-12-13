import { inject } from "@angular/core";
import { QueryClient } from "@tanstack/angular-query-experimental";
import { BaseFilterService } from "./base-filter.service";
import { getQueryConfig } from "@infrastructure/utils/query-config";
import { BaseQueryRequest } from "@shared/models";

/**
 * Base class for services that use TanStack Query.
 * Provides common query client access, configuration, and cache invalidation patterns.
 * Extends BaseFilterService for filter state management (SRP, DRY).
 * @template TFilter - Filter type extending BaseQueryRequest
 */
export abstract class BaseQueryService<TFilter extends BaseQueryRequest>
	extends BaseFilterService<TFilter>
{
	/** Query client for cache invalidation (DI) */
	protected readonly queryClient: QueryClient = inject(QueryClient);

	/** Query key prefix for cache operations (must be overridden by subclasses) */
	protected abstract readonly queryKeyPrefix: string;

	/** Query configuration (staleTime, gcTime, etc.) */
	protected get queryConfig(): ReturnType<typeof getQueryConfig>
	{
		return getQueryConfig(this.queryKeyPrefix);
	}

	/** Invalidate all queries for this entity type */
	protected invalidateAll(): void
	{
		this.queryClient.invalidateQueries({
			queryKey: [this.queryKeyPrefix]
		});
	}

	/** Invalidate a specific entity query by ID */
	protected invalidateSingle(entityId: number | string): void
	{
		this.queryClient.invalidateQueries({
			queryKey: [this.queryKeyPrefix, entityId]
		});
	}

	/** Invalidate all queries and a specific entity */
	protected invalidateAllAndSingle(entityId: number | string): void
	{
		this.invalidateAll();
		this.invalidateSingle(entityId);
	}
}
