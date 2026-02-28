import { Signal, signal } from "@angular/core";
import type {
	CreateMutationResult,
	CreateQueryResult
} from "@tanstack/angular-query-experimental";
import { type Mock, vi } from "vitest";

/**
 * Creates a mock query result for testing.
 * Simulates TanStack Query's `CreateQueryResult` interface.
 * @param {TData | undefined} data
 * The response data to populate the query result with (may be undefined).
 * @param {{ isLoading?: boolean; isError?: boolean; error?: TError | null }} options
 * Optional flags used to control the state of the returned query result.
 * @returns {CreateQueryResult<TData, TError>}
 * A mock `CreateQueryResult` suitable for unit tests.
 */
export function createMockQueryResult<TData, TError = Error>(
	data: TData | undefined,
	options: {
		isLoading?: boolean;
		isError?: boolean;
		error?: TError | null;
		isFetching?: boolean;
	} = {}): CreateQueryResult<TData, TError>
{
	const dataSignal: Signal<TData | undefined> =
		signal(data);
	const isLoadingSignal: Signal<boolean> =
		signal(options.isLoading ?? false);
	const isErrorSignal: Signal<boolean> =
		signal(options.isError ?? false);
	const errorSignal: Signal<TError | null> =
		signal(options.error ?? null);
	const isSuccessSignal: Signal<boolean> =
		signal(
			!options.isLoading && !options.isError && data !== undefined);
	const isPendingSignal: Signal<boolean> =
		signal(options.isLoading ?? false);
	const isFetchingSignal: Signal<boolean> =
		signal(options.isFetching ?? false);

	const refetchSpy: Mock =
		vi
			.fn()
			.mockResolvedValue(
				{
					data,
					error: options.error ?? null,
					isError: options.isError ?? false,
					isSuccess: !options.isLoading && !options.isError && data !== undefined
				});

	return {
		data: dataSignal,
		isLoading: isLoadingSignal,
		isError: isErrorSignal,
		error: errorSignal,
		isSuccess: isSuccessSignal,
		isPending: isPendingSignal,
		isFetching: isFetchingSignal,
		refetch: refetchSpy,
		queryKey: ["mock-key"]
	} as unknown as CreateQueryResult<TData, TError>;
}

/**
 * Creates a mock mutation result for testing.
 * Simulates TanStack Query's `CreateMutationResult` interface.
 * @param {{ isPending?: boolean; isError?: boolean; isSuccess?: boolean; error?: TError | null; data?: TData }} options
 * Optional flags used to control the state and data of the returned mutation result.
 * @returns {CreateMutationResult<TData, TError, TVariables, TContext>}
 * A mock `CreateMutationResult` suitable for unit tests.
 */
export function createMockMutationResult<
	TData,
	TError = Error,
	TVariables = unknown,
	TContext = unknown>(
	options: {
		isPending?: boolean;
		isError?: boolean;
		isSuccess?: boolean;
		error?: TError | null;
		data?: TData;
	} = {}): CreateMutationResult<TData, TError, TVariables, TContext>
{
	const isPendingSignal: Signal<boolean> =
		signal(options.isPending ?? false);
	const isErrorSignal: Signal<boolean> =
		signal(options.isError ?? false);
	const isSuccessSignal: Signal<boolean> =
		signal(options.isSuccess ?? false);
	const errorSignal: Signal<TError | null> =
		signal(options.error ?? null);
	const dataSignal: Signal<TData | undefined> =
		signal(options.data);
	const isIdleSignal: Signal<boolean> =
		signal(
			!options.isPending && !options.isError && !options.isSuccess);

	const mutateSpy: Mock =
		vi.fn();
	const mutateAsyncSpy: Mock =
		vi
			.fn()
			.mockResolvedValue(options.data);
	const resetSpy: Mock =
		vi.fn();

	return {
		mutate: mutateSpy,
		mutateAsync: mutateAsyncSpy,
		isPending: isPendingSignal,
		isError: isErrorSignal,
		isSuccess: isSuccessSignal,
		isIdle: isIdleSignal,
		error: errorSignal,
		data: dataSignal,
		reset: resetSpy
	} as unknown as CreateMutationResult<TData, TError, TVariables, TContext>;
}