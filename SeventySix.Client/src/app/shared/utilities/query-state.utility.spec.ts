import { Signal, signal } from "@angular/core";
import {
	isEmptyResult,
	isInitialLoading,
	isRefetching
} from "@shared/utilities/query-state.utility";
import type { CreateQueryResult } from "@tanstack/angular-query-experimental";

/**
 * Creates a mock query result with extended options for testing query state utilities.
 *
 * @template TData
 * The data type.
 *
 * @param {TData | undefined} data
 * The query data.
 *
 * @param {{ isPending?: boolean; isFetching?: boolean; isSuccess?: boolean; isError?: boolean }} options
 * Query state flags.
 *
 * @returns {CreateQueryResult<TData>}
 * Mock query result.
 */
function createMockQuery<TData>(
	data: TData | undefined,
	options: {
		isPending?: boolean;
		isFetching?: boolean;
		isSuccess?: boolean;
		isError?: boolean;
	} = {}): CreateQueryResult<TData>
{
	const dataSignal: Signal<TData | undefined> =
		signal(data);
	const isPendingSignal: Signal<boolean> =
		signal(options.isPending ?? false);
	const isFetchingSignal: Signal<boolean> =
		signal(options.isFetching ?? false);
	const isSuccessSignal: Signal<boolean> =
		signal(options.isSuccess ?? false);
	const isErrorSignal: Signal<boolean> =
		signal(options.isError ?? false);

	return {
		data: dataSignal,
		isPending: isPendingSignal,
		isFetching: isFetchingSignal,
		isSuccess: isSuccessSignal,
		isError: isErrorSignal
	} as unknown as CreateQueryResult<TData>;
}

describe("query-state utilities",
	() =>
	{
		describe("isInitialLoading",
			() =>
			{
				it("should return true when pending with no data",
					() =>
					{
						const mockQuery: CreateQueryResult<string> =
							createMockQuery<string>(
								undefined,
								{ isPending: true });

						const result: boolean =
							isInitialLoading(mockQuery);

						expect(result)
							.toBe(true);
					});

				it("should return false when pending but has cached data",
					() =>
					{
						const mockQuery: CreateQueryResult<string> =
							createMockQuery<string>(
								"cached-data",
								{ isPending: true });

						const result: boolean =
							isInitialLoading(mockQuery);

						expect(result)
							.toBe(false);
					});

				it("should return false when not pending",
					() =>
					{
						const mockQuery: CreateQueryResult<string> =
							createMockQuery<string>(
								undefined,
								{ isPending: false });

						const result: boolean =
							isInitialLoading(mockQuery);

						expect(result)
							.toBe(false);
					});
			});

		describe("isEmptyResult",
			() =>
			{
				it("should return true when success with empty array",
					() =>
					{
						const mockQuery: CreateQueryResult<string[]> =
							createMockQuery<string[]>(
								[],
								{ isSuccess: true });

						const result: boolean =
							isEmptyResult(mockQuery);

						expect(result)
							.toBe(true);
					});

				it("should return false when success with non-empty array",
					() =>
					{
						const mockQuery: CreateQueryResult<string[]> =
							createMockQuery<string[]>(
								["item1", "item2"],
								{ isSuccess: true });

						const result: boolean =
							isEmptyResult(mockQuery);

						expect(result)
							.toBe(false);
					});

				it("should return false when not success",
					() =>
					{
						const mockQuery: CreateQueryResult<string[]> =
							createMockQuery<string[]>(
								[],
								{ isSuccess: false });

						const result: boolean =
							isEmptyResult(mockQuery);

						expect(result)
							.toBe(false);
					});
			});

		describe("isRefetching",
			() =>
			{
				it("should return true when fetching with existing data",
					() =>
					{
						const mockQuery: CreateQueryResult<string> =
							createMockQuery<string>(
								"existing-data",
								{
									isFetching: true,
									isPending: false
								});

						const result: boolean =
							isRefetching(mockQuery);

						expect(result)
							.toBe(true);
					});

				it("should return false when not fetching",
					() =>
					{
						const mockQuery: CreateQueryResult<string> =
							createMockQuery<string>(
								"existing-data",
								{
									isFetching: false,
									isPending: false
								});

						const result: boolean =
							isRefetching(mockQuery);

						expect(result)
							.toBe(false);
					});

				it("should return false when initial fetch (pending)",
					() =>
					{
						const mockQuery: CreateQueryResult<string> =
							createMockQuery<string>(
								undefined,
								{
									isFetching: true,
									isPending: true
								});

						const result: boolean =
							isRefetching(mockQuery);

						expect(result)
							.toBe(false);
					});
			});
	});
