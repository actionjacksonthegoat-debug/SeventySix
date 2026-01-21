import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
	BaseMutationService,
	OptimisticMutationConfig
} from "@shared/services/base-mutation.service";
import { QueryOptions } from "@shared/utilities/query-config.utility";
import {
	CreateMutationResult,
	QueryClient
} from "@tanstack/angular-query-experimental";
import { Observable, of } from "rxjs";
import { vi } from "vitest";

/**
 * Concrete implementation for testing the abstract BaseMutationService.
 */
class TestMutationService extends BaseMutationService
{
	protected readonly queryKeyPrefix: string = "test-entities";

	// Expose protected methods for testing
	public testInvalidateAll(): void
	{
		this.invalidateAll();
	}

	public getQueryConfig(): QueryOptions
	{
		return this.queryConfig;
	}

	/**
	 * Exposes createOptimisticMutation for testing.
	 * @template TInput
	 * Input type.
	 * @template TResult
	 * Result type.
	 * @template TContext
	 * Context type.
	 * @param {() => Observable<TResult>} apiCall
	 * Observable factory for the API call.
	 * @param {OptimisticMutationConfig<TInput, TResult, TContext>} config
	 * Optimistic mutation configuration.
	 * @returns {CreateMutationResult<TResult, Error, TInput, TContext>}
	 * The mutation result.
	 */
	public testCreateOptimisticMutation<TInput, TResult, TContext>(
		apiCall: () => Observable<TResult>,
		config: OptimisticMutationConfig<TInput, TResult, TContext>): CreateMutationResult<TResult, Error, TInput, TContext>
	{
		return this.createOptimisticMutation(
			() => apiCall(),
			config);
	}
}

describe("BaseMutationService",
	() =>
	{
		let service: TestMutationService;
		let queryClient: QueryClient;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							TestMutationService,
							QueryClient
						]
					});

				service =
					TestBed.inject(TestMutationService);
				queryClient =
					TestBed.inject(QueryClient);
			});

		describe("initialization",
			() =>
			{
				it("should inject QueryClient",
					() =>
					{
						expect(service["queryClient"])
							.toBeDefined();
						expect(service["queryClient"])
							.toBeInstanceOf(QueryClient);
					});

				it("should set queryKeyPrefix",
					() =>
					{
						expect(service["queryKeyPrefix"])
							.toBe("test-entities");
					});

				it("should provide queryConfig based on queryKeyPrefix",
					() =>
					{
						const config: QueryOptions =
							service.getQueryConfig();

						expect(config)
							.toBeDefined();
						expect(config.staleTime)
							.toBeDefined();
						expect(config.gcTime)
							.toBeDefined();
					});
			});

		describe("invalidateAll",
			() =>
			{
				it("should invalidate all queries with queryKeyPrefix",
					() =>
					{
						const invalidateSpy: ReturnType<typeof vi.spyOn> =
							vi.spyOn(queryClient, "invalidateQueries");

						service.testInvalidateAll();

						expect(invalidateSpy)
							.toHaveBeenCalledWith(
								{
									queryKey: ["test-entities"]
								});
					});
			});

		describe("createOptimisticMutation",
			() =>
			{
				it("should expose OptimisticMutationConfig interface for typed configAsync",
					() =>
					{
						// Verify the interface is exported and usable
						const mockConfig: OptimisticMutationConfig<string, string, string> =
							{
								onMutate: (variables: string) =>
									`context-${variables}`,
								onError: (_context: string) =>
								{},
								onSuccess: (_result: string, _variables: string) =>
								{}
							};

						expect(mockConfig.onMutate)
							.toBeDefined();
						expect(mockConfig.onError)
							.toBeDefined();
						expect(mockConfig.onSuccess)
							.toBeDefined();
					});

				it("should create mutation with optimistic config structureAsync",
					() =>
					{
						const onMutateSpy: ReturnType<typeof vi.fn<(variables: string) => { previousValue: string; }>> =
							vi
								.fn<(variables: string) => { previousValue: string; }>()
								.mockReturnValue(
									{ previousValue: "old" });
						const onErrorSpy: ReturnType<typeof vi.fn<(context: { previousValue: string; }) => void>> =
							vi.fn<
								(context: { previousValue: string; }) => void>();
						const onSuccessSpy: ReturnType<typeof vi.fn<(result: string, variables: string) => void>> =
							vi.fn<
								(result: string, variables: string) => void>();

						const config: OptimisticMutationConfig<string, string, { previousValue: string; }> =
							{
								onMutate: onMutateSpy,
								onError: onErrorSpy,
								onSuccess: onSuccessSpy
							};

						const mutation: CreateMutationResult<string, Error, string, { previousValue: string; }> =
							TestBed
								.runInInjectionContext(
									() =>
										service.testCreateOptimisticMutation(
											() => of("result"),
											config));

						expect(mutation)
							.toBeDefined();
						expect(mutation.mutate)
							.toBeDefined();
					});
			});
	});
