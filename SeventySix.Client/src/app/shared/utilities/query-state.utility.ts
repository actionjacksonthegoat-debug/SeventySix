import { isNullOrUndefined } from "@shared/utilities/null-check.utility";
import type { CreateQueryResult } from "@tanstack/angular-query-experimental";

/**
 * Checks if a query is in initial loading state (no cached data).
 *
 * @template TData
 * The query data type.
 *
 * @param {CreateQueryResult<TData>} query
 * The TanStack Query result.
 *
 * @returns {boolean}
 * True if loading with no cached data.
 *
 * @example
 * if (isInitialLoading(usersQuery)) {
 *   // Show skeleton loader
 * }
 */
export function isInitialLoading<TData>(
	query: CreateQueryResult<TData>): boolean
{
	return query.isPending() && isNullOrUndefined(query.data());
}

/**
 * Checks if a query result is empty (loaded but no data).
 *
 * @template TData
 * The query data type.
 *
 * @param {CreateQueryResult<TData[]>} query
 * The TanStack Query result with array data.
 *
 * @returns {boolean}
 * True if data loaded and array is empty.
 *
 * @example
 * if (isEmptyResult(usersQuery)) {
 *   // Show empty state message
 * }
 */
export function isEmptyResult<TData>(
	query: CreateQueryResult<TData[]>): boolean
{
	return query.isSuccess() && query.data()?.length === 0;
}

/**
 * Checks if a query has stale data that is being refetched.
 * Use to show subtle loading indicator while showing stale data.
 *
 * @template TData
 * The query data type.
 *
 * @param {CreateQueryResult<TData>} query
 * The TanStack Query result.
 *
 * @returns {boolean}
 * True if fetching with existing cached data.
 *
 * @example
 * <app-table [isRefetching]="isRefetching(usersQuery)" />
 */
export function isRefetching<TData>(
	query: CreateQueryResult<TData>): boolean
{
	return query.isFetching() && !query.isPending();
}
