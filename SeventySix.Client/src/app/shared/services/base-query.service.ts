import { inject } from "@angular/core";
import { BaseQueryRequest } from "@shared/models";
import { BaseFilterService } from "@shared/services/base-filter.service";
import { getQueryConfig } from "@shared/utilities/query-config.utility";
import { CreateMutationResult, injectMutation, QueryClient } from "@tanstack/angular-query-experimental";
import { lastValueFrom, Observable } from "rxjs";

/**
 * Base class for services that use TanStack Query.
 * Provides common query client access, configuration, and cache invalidation patterns.
 * Extends BaseFilterService for filter state management (SRP, DRY).
 * @template TFilter - Filter type extending BaseQueryRequest
 */
export abstract class BaseQueryService<TFilter extends BaseQueryRequest> extends BaseFilterService<TFilter>
{
	/**
	 * Query client for cache invalidation (DI).
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

	/**
	 * Invalidate all queries and a specific entity.
	 * @param {number | string} entityId
	 * The entity identifier to invalidate.
	 * @returns {void}
	 */
	protected invalidateAllAndSingle(entityId: number | string): void
	{
		this.invalidateAll();
		this.invalidateSingle(entityId);
	}

	/**
	 * Creates a mutation with automatic query invalidation (DRY factory pattern).
	 * Reduces boilerplate by handling Observable → Promise conversion and cache invalidation.
	 * @template TInput - Input type for mutation function
	 * @template TResult - Result type returned from API
	 * @param {(input: TInput) => Observable<TResult>} mutationFunction
	 * Observable-returning function to execute.
	 * @param {(result: TResult, variables: TInput) => void | undefined} onSuccessCallback
	 * Optional callback for custom invalidation logic (receives result and variables).
	 * @returns {CreateMutationResult<TResult, Error, TInput>}
	 * TanStack Query mutation result
	 */
	protected createMutation<TInput, TResult>(
		mutationFunction: (input: TInput) => Observable<TResult>,
		onSuccessCallback?: (
			result: TResult,
			variables: TInput) => void): CreateMutationResult<TResult, Error, TInput>
	{
		return injectMutation(
			() => ({
				mutationFn: (input: TInput) =>
					lastValueFrom(mutationFunction(input)),
				onSuccess: (result, variables) =>
				{
					if (onSuccessCallback)
					{
						onSuccessCallback(result, variables);
					}
					else
					{
						this.invalidateAll();
					}
				}
			}));
	}
}
