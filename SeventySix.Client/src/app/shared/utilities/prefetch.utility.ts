import { QueryClient } from "@tanstack/angular-query-experimental";

/**
 * Creates a prefetch function for a query.
 * Use with mouse hover events to improve perceived performance.
 *
 * @template TData
 * The data type returned by the query.
 *
 * @param {QueryClient} queryClient
 * The TanStack Query client instance.
 *
 * @param {readonly unknown[]} queryKey
 * The query key to prefetch.
 *
 * @param {() => Promise<TData>} queryFn
 * The query function to execute.
 *
 * @param {number} staleTime
 * Time in ms to consider data fresh (default: 30000).
 *
 * @returns {() => void}
 * Function to call on hover to trigger prefetch.
 *
 * @example
 * const prefetchUser = createPrefetch(
 *   queryClient,
 *   QueryKeys.users.single(userId),
 *   () => lastValueFrom(apiService.get<UserDto>(\`users/\${userId}\`)),
 *   60000
 * );
 * // Call on mouseenter event
 * prefetchUser();
 */
export function createPrefetch<TData>(
	queryClient: QueryClient,
	queryKey: readonly unknown[],
	queryFn: () => Promise<TData>,
	staleTime: number = 30000): () => void
{
	return (): void =>
	{
		void queryClient.prefetchQuery(
			{
				queryKey,
				queryFn,
				staleTime
			});
	};
}
