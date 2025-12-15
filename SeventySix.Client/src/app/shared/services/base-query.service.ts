import { inject } from "@angular/core";
import { BaseQueryRequest } from "@shared/models";
import { getQueryConfig } from "@shared/utilities/query-config";
import { CreateMutationResult, injectMutation, QueryClient } from "@tanstack/angular-query-experimental";
import { lastValueFrom, Observable } from "rxjs";
import { BaseFilterService } from "@shared/services/base-filter.service";

/**
 * Base class for services that use TanStack Query.
 * Provides common query client access, configuration, and cache invalidation patterns.
 * Extends BaseFilterService for filter state management (SRP, DRY).
 * @template TFilter - Filter type extending BaseQueryRequest
 */
export abstract class BaseQueryService<TFilter extends BaseQueryRequest> extends BaseFilterService<TFilter>
{
	/** Query client for cache invalidation (DI) */
	protected readonly queryClient: QueryClient =
		inject(QueryClient);

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
		this.queryClient.invalidateQueries(
			{
				queryKey: [this.queryKeyPrefix]
			});
	}

	/** Invalidate a specific entity query by ID */
	protected invalidateSingle(entityId: number | string): void
	{
		this.queryClient.invalidateQueries(
			{
				queryKey: [this.queryKeyPrefix, entityId]
			});
	}

	/** Invalidate all queries and a specific entity */
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
	 * @param mutationFunction - Observable-returning function to execute
	 * @param onSuccessCallback - Optional callback for custom invalidation logic (receives result and variables)
	 * @returns TanStack Query mutation result
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
