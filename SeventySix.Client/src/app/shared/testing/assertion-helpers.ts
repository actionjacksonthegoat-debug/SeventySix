/**
 * Assertion helpers for TanStack Query tests.
 * Provides semantic assertions for query and mutation states.
 * Follows KISS and DRY principles.
 */

import type {
	CreateMutationResult,
	CreateQueryResult
} from "@tanstack/angular-query-experimental";
import { expect } from "vitest";

/**
 * Asserts that a query is in loading state.
 *
 * @template TData
 * Query data type.
 * @param {CreateQueryResult<TData>} query
 * TanStack Query result to check.
 * @throws {Error}
 * When query is not in loading state.
 *
 * @example
 * const query = service.getData();
 * expectQueryLoading(query);
 */
export function expectQueryLoading<TData>(
	query: CreateQueryResult<TData>): void
{
	expect(query.isLoading())
	.toBe(true);
	expect(query.isSuccess())
	.toBe(false);
	expect(query.isError())
	.toBe(false);
}

/**
 * Asserts that a query succeeded with expected data.
 *
 * @template TData
 * Query data type.
 * @param {CreateQueryResult<TData>} query
 * TanStack Query result to check.
 * @param {TData} expectedData
 * Expected data value.
 * @throws {Error}
 * When query is not successful or data doesn't match.
 *
 * @example
 * const query = service.getData();
 * await flushMicrotasks();
 * expectQuerySuccess(query, expectedUserData);
 */
export function expectQuerySuccess<TData>(
	query: CreateQueryResult<TData>,
	expectedData: TData): void
{
	expect(query.isSuccess())
	.toBe(true);
	expect(query.isLoading())
	.toBe(false);
	expect(query.isError())
	.toBe(false);
	expect(query.data())
	.toEqual(expectedData);
}

/**
 * Asserts that a query is in error state.
 *
 * @template TData
 * Query data type.
 * @template TError
 * Error type.
 * @param {CreateQueryResult<TData, TError>} query
 * TanStack Query result to check.
 * @throws {Error}
 * When query is not in error state.
 *
 * @example
 * const query = service.getData();
 * await flushMicrotasks();
 * expectQueryError(query);
 */
export function expectQueryError<TData, TError = Error>(
	query: CreateQueryResult<TData, TError>): void
{
	expect(query.isError())
	.toBe(true);
	expect(query.isSuccess())
	.toBe(false);
	expect(query.error())
	.toBeTruthy();
}

/**
 * Asserts that a query is in error state with specific error.
 *
 * @template TData
 * Query data type.
 * @template TError
 * Error type.
 * @param {CreateQueryResult<TData, TError>} query
 * TanStack Query result to check.
 * @param {TError} expectedError
 * Expected error value.
 * @throws {Error}
 * When query error doesn't match.
 *
 * @example
 * expectQueryErrorWith(query, new Error("Not found"));
 */
export function expectQueryErrorWith<TData, TError = Error>(
	query: CreateQueryResult<TData, TError>,
	expectedError: TError): void
{
	expectQueryError(query);
	expect(query.error())
	.toEqual(expectedError);
}

/**
 * Asserts that a mutation is in pending state.
 *
 * @template TData
 * Mutation data type.
 * @template TError
 * Mutation error type.
 * @template TVariables
 * Mutation variables type.
 * @param {CreateMutationResult<TData, TError, TVariables>} mutation
 * TanStack mutation result to check.
 * @throws {Error}
 * When mutation is not pending.
 *
 * @example
 * const mutation = service.updateUser();
 * mutation.mutate(userData);
 * expectMutationPending(mutation);
 */
export function expectMutationPending<TData, TError = Error, TVariables = unknown>(
	mutation: CreateMutationResult<TData, TError, TVariables>): void
{
	expect(mutation.isPending())
	.toBe(true);
	expect(mutation.isSuccess())
	.toBe(false);
	expect(mutation.isError())
	.toBe(false);
}

/**
 * Asserts that a mutation succeeded.
 *
 * @template TData
 * Mutation data type.
 * @template TError
 * Mutation error type.
 * @template TVariables
 * Mutation variables type.
 * @param {CreateMutationResult<TData, TError, TVariables>} mutation
 * TanStack mutation result to check.
 * @throws {Error}
 * When mutation is not successful.
 *
 * @example
 * const mutation = service.updateUser();
 * mutation.mutate(userData);
 * await flushMicrotasks();
 * expectMutationSuccess(mutation);
 */
export function expectMutationSuccess<TData, TError = Error, TVariables = unknown>(
	mutation: CreateMutationResult<TData, TError, TVariables>): void
{
	expect(mutation.isSuccess())
	.toBe(true);
	expect(mutation.isPending())
	.toBe(false);
	expect(mutation.isError())
	.toBe(false);
}

/**
 * Asserts that a mutation succeeded with expected data.
 *
 * @template TData
 * Mutation data type.
 * @template TError
 * Mutation error type.
 * @template TVariables
 * Mutation variables type.
 * @param {CreateMutationResult<TData, TError, TVariables>} mutation
 * TanStack mutation result to check.
 * @param {TData} expectedData
 * Expected response data.
 * @throws {Error}
 * When mutation data doesn't match.
 *
 * @example
 * expectMutationSuccessWith(mutation, { id: 1, name: "Updated" });
 */
export function expectMutationSuccessWith<TData, TError = Error, TVariables = unknown>(
	mutation: CreateMutationResult<TData, TError, TVariables>,
	expectedData: TData): void
{
	expectMutationSuccess(mutation);
	expect(mutation.data())
	.toEqual(expectedData);
}

/**
 * Asserts that a mutation is in error state.
 *
 * @template TData
 * Mutation data type.
 * @template TError
 * Mutation error type.
 * @template TVariables
 * Mutation variables type.
 * @param {CreateMutationResult<TData, TError, TVariables>} mutation
 * TanStack mutation result to check.
 * @throws {Error}
 * When mutation is not in error state.
 *
 * @example
 * const mutation = service.updateUser();
 * mutation.mutate(invalidData);
 * await flushMicrotasks();
 * expectMutationError(mutation);
 */
export function expectMutationError<TData, TError = Error, TVariables = unknown>(
	mutation: CreateMutationResult<TData, TError, TVariables>): void
{
	expect(mutation.isError())
	.toBe(true);
	expect(mutation.isSuccess())
	.toBe(false);
	expect(mutation.error())
	.toBeTruthy();
}

/**
 * Asserts that a mutation is in idle state (not yet called).
 *
 * @template TData
 * Mutation data type.
 * @template TError
 * Mutation error type.
 * @template TVariables
 * Mutation variables type.
 * @param {CreateMutationResult<TData, TError, TVariables>} mutation
 * TanStack mutation result to check.
 * @throws {Error}
 * When mutation is not idle.
 *
 * @example
 * const mutation = service.updateUser();
 * // Before calling mutate
 * expectMutationIdle(mutation);
 */
export function expectMutationIdle<TData, TError = Error, TVariables = unknown>(
	mutation: CreateMutationResult<TData, TError, TVariables>): void
{
	expect(mutation.isIdle())
	.toBe(true);
	expect(mutation.isPending())
	.toBe(false);
	expect(mutation.isSuccess())
	.toBe(false);
	expect(mutation.isError())
	.toBe(false);
}
