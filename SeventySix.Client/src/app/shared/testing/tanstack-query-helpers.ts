import { Signal, signal } from "@angular/core";
import type {
	CreateMutationResult,
	CreateQueryResult
} from "@tanstack/angular-query-experimental";
import { vi, type Mock } from "vitest";

/**
 * Creates a mock query result for testing
 * Simulates TanStack Query's CreateQueryResult interface
 */
export function createMockQueryResult<TData, TError = Error>(
	data: TData | undefined,
	options: {
		isLoading?: boolean;
		isError?: boolean;
		error?: TError | null;
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
		refetch: refetchSpy,
		queryKey: ["mock-key"]
	} as unknown as CreateQueryResult<TData, TError>;
}

/**
 * Creates a mock mutation result for testing
 * Simulates TanStack Query's CreateMutationResult interface
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
