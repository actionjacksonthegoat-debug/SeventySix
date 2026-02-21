import { BaseQueryClientService } from "@shared/services/base-query-client.service";
import {
	createMutation as createMutationFactory,
	createOptimisticMutation as createOptimisticMutationFactory,
	OptimisticMutationConfig
} from "@shared/utilities/mutation-factory.utility";
import { CreateMutationResult } from "@tanstack/angular-query-experimental";
import { Observable } from "rxjs";

// Re-export for backward compatibility with existing imports
export type { OptimisticMutationConfig } from "@shared/utilities/mutation-factory.utility";

/**
 * Base class for services needing mutation support without filter state.
 * Use when service needs createMutation() but doesn't manage paginated filters.
 * For services needing both mutations AND filter state, use BaseQueryService instead.
 */
export abstract class BaseMutationService extends BaseQueryClientService
{
	// Inherits from BaseQueryClientService:
	// - queryClient: QueryClient
	// - abstract queryKeyPrefix: string
	// - queryConfig getter
	// - invalidateAll()
	// - invalidateSingle(entityId)

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
		return createMutationFactory(
			this.queryClient,
			this.queryKeyPrefix,
			mutationFunction,
			onSuccessCallback);
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
		return createOptimisticMutationFactory(
			this.queryClient,
			this.queryKeyPrefix,
			mutationFunction,
			config);
	}
}