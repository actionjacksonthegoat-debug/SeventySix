/**
 * Mutation test helpers.
 * Provides utilities for testing TanStack Query mutations with callbacks.
 * Follows DRY and KISS principles.
 */

import { Signal, signal, WritableSignal } from "@angular/core";
import type { CreateMutationResult } from "@tanstack/angular-query-experimental";
import { type Mock, vi } from "vitest";

/**
 * Configuration options for creating mock mutations with callbacks.
 */
export interface MockMutationCallbackOptions<TData, TError = Error>
{
	/**
	 * Data to return from onMutate callback.
	 */
	onMutateResult?: TData;

	/**
	 * Whether the mutation should succeed.
	 * @default true
	 */
	shouldSucceed?: boolean;

	/**
	 * Error to return if shouldSucceed is false.
	 */
	error?: TError;

	/**
	 * Data to return on success.
	 */
	successData?: TData;
}

/**
 * Result of creating a mock mutation with callbacks.
 */
export interface MockMutationWithCallbacks<TData, TError, TVariables, TContext>
{
	/**
	 * The mock mutation result.
	 */
	mutation: CreateMutationResult<TData, TError, TVariables, TContext>;

	/**
	 * Callback spies for assertions.
	 */
	callbacks: {
		onMutate: Mock;
		onSuccess: Mock;
		onError: Mock;
		onSettled: Mock;
	};

	/**
	 * Triggers the mutation to complete (success or error based on config).
	 */
	complete: () => void;
}

/**
 * Creates a mock mutation that triggers callbacks.
 * Useful for testing onSuccess/onError/onSettled flows.
 *
 * @template TData
 * Mutation data type.
 * @template TError
 * Error type.
 * @template TVariables
 * Variables type.
 * @template TContext
 * Context type.
 * @param {MockMutationCallbackOptions<TData, TError>} options
 * Configuration options for the mock mutation.
 * @returns {MockMutationWithCallbacks<TData, TError, TVariables, TContext>}
 * Mock mutation result with callbacks and completion control.
 *
 * @example
 * const { mutation, callbacks, complete } = createMockMutationWithCallbacks<UserDto, Error, UpdateUserRequest, unknown>({
 *   shouldSucceed: true,
 *   successData: { id: 1, name: "Updated" }
 * });
 *
 * // Trigger the mutation
 * mutation.mutate({ name: "New Name" });
 *
 * // Complete it
 * complete();
 *
 * // Assert callbacks were called
 * expect(callbacks.onSuccess).toHaveBeenCalledWith({ id: 1, name: "Updated" });
 */
export function createMockMutationWithCallbacks<
	TData,
	TError = Error,
	TVariables = unknown,
	TContext = unknown>(
	options: MockMutationCallbackOptions<TData, TError> = {}): MockMutationWithCallbacks<TData, TError, TVariables, TContext>
{
	const shouldSucceed: boolean =
		options.shouldSucceed ?? true;

	const isPendingSignal: WritableSignal<boolean> =
		signal(false);
	const isSuccessSignal: WritableSignal<boolean> =
		signal(false);
	const isErrorSignal: WritableSignal<boolean> =
		signal(false);
	const isIdleSignal: WritableSignal<boolean> =
		signal(true);
	const dataSignal: WritableSignal<TData | undefined> =
		signal(undefined);
	const errorSignal: WritableSignal<TError | null> =
		signal(null);

	const callbacks: MockMutationWithCallbacks<TData, TError, TVariables, TContext>["callbacks"] =
		{
			onMutate: vi.fn(),
			onSuccess: vi.fn(),
			onError: vi.fn(),
			onSettled: vi.fn()
		};

	const mutateSpy: Mock =
		vi.fn(
			(_variables: TVariables) =>
			{
				isPendingSignal.set(true);
				isIdleSignal.set(false);
				callbacks.onMutate(_variables);
			});

	const mutateAsyncSpy: Mock =
		vi.fn(
			(_variables: TVariables) =>
			{
				isPendingSignal.set(true);
				isIdleSignal.set(false);
				callbacks.onMutate(_variables);

				return new Promise<TData>(
					(resolve, reject) =>
					{
					// Store resolve/reject for manual completion
						(mutateSpy as Mock & { _resolve?: (value: TData) => void; _reject?: (error: TError) => void; })
							._resolve = resolve;
						(mutateSpy as Mock & { _resolve?: (value: TData) => void; _reject?: (error: TError) => void; })
							._reject = reject;
					});
			});

	const resetSpy: Mock =
		vi.fn(
			() =>
			{
				isPendingSignal.set(false);
				isSuccessSignal.set(false);
				isErrorSignal.set(false);
				isIdleSignal.set(true);
				dataSignal.set(undefined);
				errorSignal.set(null);
			});

	const complete: () => void =
		() =>
		{
			isPendingSignal.set(false);

			if (shouldSucceed)
			{
				isSuccessSignal.set(true);
				dataSignal.set(options.successData);
				callbacks.onSuccess(options.successData);
				callbacks.onSettled(options.successData, null);
			}
			else
			{
				isErrorSignal.set(true);
				errorSignal.set(options.error ?? null);
				callbacks.onError(options.error);
				callbacks.onSettled(undefined, options.error);
			}
		};

	const mutation: CreateMutationResult<TData, TError, TVariables, TContext> =
		{
			mutate: mutateSpy,
			mutateAsync: mutateAsyncSpy,
			reset: resetSpy,
			isPending: isPendingSignal as Signal<boolean>,
			isSuccess: isSuccessSignal as Signal<boolean>,
			isError: isErrorSignal as Signal<boolean>,
			isIdle: isIdleSignal as Signal<boolean>,
			data: dataSignal as Signal<TData | undefined>,
			error: errorSignal as Signal<TError | null>
		} as unknown as CreateMutationResult<TData, TError, TVariables, TContext>;

	return {
		mutation,
		callbacks,
		complete
	};
}

/**
 * Creates a simple mock mutation that immediately succeeds.
 * Useful for testing mutation flows without async complexity.
 *
 * @template TData
 * Mutation data type.
 * @template TVariables
 * Variables type.
 * @param {TData} successData
 * Data to return on success.
 * @returns {CreateMutationResult<TData, Error, TVariables, unknown>}
 * Mock mutation that succeeds immediately.
 *
 * @example
 * const mockMutation = createSucceedingMutation<UserDto, UpdateUserRequest>({ id: 1 });
 * // Returns a mutation that shows success state
 */
export function createSucceedingMutation<TData, TVariables = unknown>(
	successData: TData): CreateMutationResult<TData, Error, TVariables, unknown>
{
	const dataSignal: Signal<TData | undefined> =
		signal(successData);
	const isSuccessSignal: Signal<boolean> =
		signal(true);
	const isPendingSignal: Signal<boolean> =
		signal(false);
	const isErrorSignal: Signal<boolean> =
		signal(false);
	const isIdleSignal: Signal<boolean> =
		signal(false);
	const errorSignal: Signal<Error | null> =
		signal(null);

	return {
		mutate: vi.fn(),
		mutateAsync: vi
			.fn()
			.mockResolvedValue(successData),
		reset: vi.fn(),
		isPending: isPendingSignal,
		isSuccess: isSuccessSignal,
		isError: isErrorSignal,
		isIdle: isIdleSignal,
		data: dataSignal,
		error: errorSignal
	} as unknown as CreateMutationResult<TData, Error, TVariables, unknown>;
}

/**
 * Creates a simple mock mutation that is in error state.
 * Useful for testing error handling flows.
 *
 * @template TData
 * Mutation data type.
 * @template TVariables
 * Variables type.
 * @param {Error} error
 * Error to return.
 * @returns {CreateMutationResult<TData, Error, TVariables, unknown>}
 * Mock mutation in error state.
 *
 * @example
 * const mockMutation = createFailingMutation<UserDto>(new Error("Update failed"));
 * // Returns a mutation that shows error state
 */
export function createFailingMutation<TData, TVariables = unknown>(
	error: Error): CreateMutationResult<TData, Error, TVariables, unknown>
{
	const dataSignal: Signal<TData | undefined> =
		signal(undefined);
	const isSuccessSignal: Signal<boolean> =
		signal(false);
	const isPendingSignal: Signal<boolean> =
		signal(false);
	const isErrorSignal: Signal<boolean> =
		signal(true);
	const isIdleSignal: Signal<boolean> =
		signal(false);
	const errorSignal: Signal<Error | null> =
		signal(error);

	return {
		mutate: vi.fn(),
		mutateAsync: vi
			.fn()
			.mockRejectedValue(error),
		reset: vi.fn(),
		isPending: isPendingSignal,
		isSuccess: isSuccessSignal,
		isError: isErrorSignal,
		isIdle: isIdleSignal,
		data: dataSignal,
		error: errorSignal
	} as unknown as CreateMutationResult<TData, Error, TVariables, unknown>;
}
