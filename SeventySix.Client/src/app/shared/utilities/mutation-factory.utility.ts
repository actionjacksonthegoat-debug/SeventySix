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
 * Creates a mutation with automatic query invalidation (DRY factory pattern).
 * Reduces boilerplate by handling Observable → Promise conversion and cache invalidation.
 * @template TInput
 * Input type for mutation function.
 * @template TResult
 * Result type returned from API.
 * @param {QueryClient} queryClient
 * TanStack Query client for cache operations.
 * @param {string} queryKeyPrefix
 * Query key prefix for cache invalidation.
 * @param {(input: TInput) => Observable<TResult>} mutationFunction
 * Observable-returning function to execute for the mutation.
 * @param {(result: TResult, variables: TInput) => void} [onSuccessCallback]
 * Optional callback for custom invalidation logic (receives result and variables).
 * @returns {CreateMutationResult<TResult, Error, TInput>}
 * TanStack Query mutation result.
 */
export function createMutation<TInput, TResult>(
	queryClient: QueryClient,
	queryKeyPrefix: string,
	mutationFunction: (input: TInput) => Observable<TResult>,
	onSuccessCallback?: (
		result: TResult,
		variables: TInput) => void): CreateMutationResult<TResult, Error, TInput>
{
	return injectMutation(
		() => (
			{
				mutationFn: (input: TInput) =>
					lastValueFrom(mutationFunction(input)),
				onSuccess: (
					mutationResult: TResult,
					mutationVariables: TInput) =>
				{
					if (onSuccessCallback)
					{
						onSuccessCallback(
							mutationResult,
							mutationVariables);
					}
					else
					{
						queryClient.invalidateQueries(
							{
								queryKey: [queryKeyPrefix]
							});
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
 * @param {QueryClient} queryClient
 * TanStack Query client for cache operations.
 * @param {string} queryKeyPrefix
 * Query key prefix for cache invalidation.
 * @param {(input: TInput) => Observable<TResult>} mutationFunction
 * Observable-returning function to execute for the mutation.
 * @param {OptimisticMutationConfig<TInput, TResult, TContext>} config
 * Configuration for optimistic update behavior.
 * @returns {CreateMutationResult<TResult, Error, TInput, TContext>}
 * TanStack Query mutation result with optimistic context.
 */
export function createOptimisticMutation<TInput, TResult, TContext>(
	queryClient: QueryClient,
	queryKeyPrefix: string,
	mutationFunction: (input: TInput) => Observable<TResult>,
	config: OptimisticMutationConfig<TInput, TResult, TContext>): CreateMutationResult<TResult, Error, TInput, TContext>
{
	return injectMutation(
		() => (
			{
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
					mutationResult: TResult,
					mutationVariables: TInput) =>
				{
					if (config.onSuccess)
					{
						config.onSuccess(
							mutationResult,
							mutationVariables);
					}
				},
				onSettled: () =>
				{
					queryClient.invalidateQueries(
						{
							queryKey: [queryKeyPrefix]
						});
				}
			}));
}