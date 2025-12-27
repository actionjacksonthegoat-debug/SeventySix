import { inject } from "@angular/core";
import { getQueryConfig } from "@shared/utilities/query-config.utility";
import {
	CreateMutationResult,
	injectMutation,
	QueryClient
} from "@tanstack/angular-query-experimental";
import {
	lastValueFrom,
	Observable
} from "rxjs";

/**
 * Base class for services needing mutation support without filter state.
 * Use when service needs createMutation() but doesn't manage paginated filters.
 * For services needing both mutations AND filter state, use BaseQueryService instead.
 */
export abstract class BaseMutationService
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
	 * Creates a mutation with automatic query invalidation (DRY factory pattern).
	 * Reduces boilerplate by handling Observable → Promise conversion and cache invalidation.
	 * @template TInput
	 * Input type for mutation function.
	 * @template TResult
	 * Result type returned from API.
	 * @param {(input: TInput) => Observable<TResult>} mutationFunction
	 * Observable-returning function to execute for the mutation.
	 * @param {(result: TResult, variables: TInput) => void | undefined} [onSuccessCallback]
	 * Optional callback for custom invalidation logic (receives result and variables).
	 * @returns {CreateMutationResult<TResult, Error, TInput>}
	 * TanStack Query mutation result.
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
