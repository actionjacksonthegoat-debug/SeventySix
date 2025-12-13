/**
 * Standalone mutation factory for services that don't extend BaseQueryService.
 * Provides the same boilerplate reduction as BaseQueryService.createMutation()
 * but accessible to any service.
 */

import {
	injectMutation,
	CreateMutationResult,
	QueryClient
} from "@tanstack/angular-query-experimental";
import { Observable, lastValueFrom } from "rxjs";

/**
 * Creates a mutation with automatic query invalidation (DRY factory pattern).
 * Reduces boilerplate by handling Observable → Promise conversion and cache invalidation.
 * @template TInput - Input type for mutation function
 * @template TResult - Result type returned from API
 * @param mutationFunction - Observable-returning function to execute
 * @param queryClient - Query client for cache invalidation
 * @param queryKeyPrefix - Query key prefix for invalidation (e.g., 'account', 'permissionRequests')
 * @param onSuccessCallback - Optional callback for custom invalidation logic (receives result and variables)
 * @returns TanStack Query mutation result
 */
export function createMutation<TInput, TResult>(
	mutationFunction: (input: TInput) => Observable<TResult>,
	queryClient: QueryClient,
	queryKeyPrefix: string,
	onSuccessCallback?: (
		result: TResult,
		variables: TInput
	) => void
): CreateMutationResult<TResult, Error, TInput>
{
	return injectMutation(() => ({
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
				queryClient.invalidateQueries({
					queryKey: [queryKeyPrefix]
				});
			}
		}
	}));
}
