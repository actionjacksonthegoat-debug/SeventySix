import { inject } from "@angular/core";
import { getQueryConfig } from "@shared/utilities/query-config.utility";
import { QueryClient } from "@tanstack/angular-query-experimental";

/**
 * Base class for query-only services without mutation or filter support.
 * Use when service only needs to read data without modifications.
 * For services needing mutations, use BaseMutationService.
 * For services needing mutations AND filters, use BaseQueryService.
 */
export abstract class BaseReadOnlyService
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
	 * Useful when external events (WebSocket, etc.) indicate data changed.
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
