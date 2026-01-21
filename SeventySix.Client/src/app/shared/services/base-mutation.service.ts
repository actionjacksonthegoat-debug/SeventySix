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
 * Configuration for optimistic mutations.
 * @template TInput
 * The input type for the mutation.
 * @template TResult
 * The expected result type from the API.
 * @template TContext
 * The rollback context type (typically cached data snapshot).
 */
export interface OptimisticMutationConfig<TInput, TResult, TContext>
{
	/**
	 * Function to apply optimistic update to cache before API call.
	 * @param {TInput} variables
	 * The mutation input variables.
	 * @returns {TContext}
	 * Context data needed to rollback on failure.
	 */
	onMutate: (variables: TInput) => TContext;

	/**
	 * Function to rollback optimistic update on error.
	 * @param {TContext} context
	 * The context returned from onMutate.
	 * @returns {void}
	 */
	onError: (context: TContext) => void;

	/**
	 * Optional success callback for additional processing.
	 * @param {TResult} result
	 * The API response.
	 * @param {TInput} variables
	 * The mutation input variables.
	 * @returns {void}
	 */
	onSuccess?: (
		result: TResult,
		variables: TInput) => void;
}

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

	/**
	 * Creates an optimistic mutation that updates UI immediately before API call completes.
	 * Automatically rolls back changes on error and invalidates queries on success.
	 * @template TInput
	 * Input type for mutation function.
	 * @template TResult
	 * Result type returned from API.
	 * @template TContext
	 * Context type for rollback (typically cached data snapshot).
	 * @param {(input: TInput) => Observable<TResult>} mutationFunction
	 * Observable-returning function to execute for the mutation.
	 * @param {OptimisticMutationConfig<TInput, TResult, TContext>} config
	 * Configuration for optimistic update behavior.
	 * @returns {CreateMutationResult<TResult, Error, TInput, TContext>}
	 * TanStack Query mutation result with optimistic context.
	 */
	protected createOptimisticMutation<TInput, TResult, TContext>(
		mutationFunction: (input: TInput) => Observable<TResult>,
		config: OptimisticMutationConfig<TInput, TResult, TContext>): CreateMutationResult<TResult, Error, TInput, TContext>
	{
		return injectMutation(
			() => ({
				mutationFn: (input: TInput) =>
					lastValueFrom(mutationFunction(input)),
				onMutate: (variables: TInput): TContext =>
					config.onMutate(variables),
				onError: (
					_error: Error,
					_variables: TInput,
					context: TContext | undefined) =>
				{
					if (context !== undefined)
					{
						config.onError(context);
					}
				},
				onSuccess: (
					result: TResult,
					variables: TInput) =>
				{
					if (config.onSuccess)
					{
						config.onSuccess(result, variables);
					}
				},
				onSettled: () =>
				{
					this.invalidateAll();
				}
			}));
	}
}
