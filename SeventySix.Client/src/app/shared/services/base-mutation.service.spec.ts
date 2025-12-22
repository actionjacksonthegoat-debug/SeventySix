import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { QueryOptions } from "@shared/utilities/query-config.utility";
import { QueryClient } from "@tanstack/angular-query-experimental";
import { vi } from "vitest";
import { BaseMutationService } from "./base-mutation.service";

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
	});
