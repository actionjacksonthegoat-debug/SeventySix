import { inject } from "@angular/core";
import { getQueryConfig } from "@shared/utilities/query-config.utility";
import { QueryClient } from "@tanstack/angular-query-experimental";

/**
 * Abstract base providing common query client operations.
 * Foundation for all services interacting with TanStack Query cache.
 * Consolidates duplicated queryConfig getter and invalidation methods (DRY).
 */
export abstract class BaseQueryClientService
{
	/**
	 * Query client for cache operations (DI).
	 * @type {QueryClient}
	 * @protected
	 * @readonly
	 */
	protected readonly queryClient: QueryClient =
		inject(QueryClient);

	/**
	 * Query key prefix for cache operations (must be overridden by subclasses).
	 * @type {string}
	 * @protected
	 * @abstract
	 */
	protected abstract readonly queryKeyPrefix: string;

	/**
	 * Query configuration (staleTime, gcTime, etc.).
	 * @type {ReturnType<typeof getQueryConfig>}
	 * @protected
	 */
	protected get queryConfig(): ReturnType<typeof getQueryConfig>
	{
		return getQueryConfig(this.queryKeyPrefix);
	}

	/**
	 * Invalidate all queries for this entity type.
	 * @returns {void}
	 */
	protected invalidateAll(): void
	{
		this.queryClient.invalidateQueries(
			{
				queryKey: [this.queryKeyPrefix]
			});
	}

	/**
	 * Invalidate a specific entity query by ID.
	 * @param {number | string} entityId
	 * The entity identifier used in the query key.
	 * @returns {void}
	 */
	protected invalidateSingle(entityId: number | string): void
	{
		this.queryClient.invalidateQueries(
			{
				queryKey: [this.queryKeyPrefix, entityId]
			});
	}
}
