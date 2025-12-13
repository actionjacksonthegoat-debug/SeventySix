import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { QueryOptions } from "@infrastructure/utils/query-config";
import { BaseQueryRequest } from "@shared/models";
import { QueryClient } from "@tanstack/angular-query-experimental";
import { BaseQueryService } from "./base-query.service";

interface TestQueryRequest extends BaseQueryRequest
{
	searchTerm?: string;
}

class TestQueryService extends BaseQueryService<TestQueryRequest>
{
	protected readonly queryKeyPrefix: string = "test-entities";

	constructor()
	{
		super({
			page: 1,
			pageSize: 25,
			sortBy: "Id",
			sortDescending: false,
			startDate: null,
			endDate: null
		});
	}

	clearFilters(): void
	{
		this.resetFilter();
	}

	// Expose protected methods for testing
	public testInvalidateAll(): void
	{
		this.invalidateAll();
	}

	public testInvalidateSingle(entityId: number | string): void
	{
		this.invalidateSingle(entityId);
	}

	public testInvalidateAllAndSingle(entityId: number | string): void
	{
		this.invalidateAllAndSingle(entityId);
	}
}

describe("BaseQueryService", () =>
{
	let service: TestQueryService;
	let queryClient: QueryClient;

	beforeEach(() =>
	{
		TestBed.configureTestingModule({
			providers: [
				provideZonelessChangeDetection(),
				TestQueryService,
				QueryClient
			]
		});

		service =
			TestBed.inject(TestQueryService);
		queryClient =
			TestBed.inject(QueryClient);
	});

	describe("initialization", () =>
	{
		it("should inject QueryClient", () =>
		{
			expect(service["queryClient"])
				.toBeDefined();
			expect(service["queryClient"])
				.toBeInstanceOf(QueryClient);
		});

		it("should set queryKeyPrefix", () =>
		{
			expect(service["queryKeyPrefix"])
				.toBe("test-entities");
		});

		it("should provide queryConfig based on queryKeyPrefix", () =>
		{
			const config: QueryOptions =
				service["queryConfig"];

			expect(config)
				.toBeDefined();
			expect(config.staleTime)
				.toBeDefined();
			expect(config.gcTime)
				.toBeDefined();
		});
	});

	describe("cache invalidation", () =>
	{
		beforeEach(() =>
		{
			spyOn(queryClient, "invalidateQueries");
		});

		it("should invalidate all queries with queryKeyPrefix", () =>
		{
			service.testInvalidateAll();

			expect(queryClient.invalidateQueries)
				.toHaveBeenCalledWith({
					queryKey: ["test-entities"]
				});
		});

		it("should invalidate single entity query", () =>
		{
			service.testInvalidateSingle(42);

			expect(queryClient.invalidateQueries)
				.toHaveBeenCalledWith({
					queryKey: ["test-entities", 42]
				});
		});

		it("should invalidate all and single entity queries", () =>
		{
			service.testInvalidateAllAndSingle(99);

			expect(queryClient.invalidateQueries)
				.toHaveBeenCalledTimes(2);
			expect(queryClient.invalidateQueries)
				.toHaveBeenCalledWith({
					queryKey: ["test-entities"]
				});
			expect(queryClient.invalidateQueries)
				.toHaveBeenCalledWith({
					queryKey: ["test-entities", 99]
				});
		});
	});

	describe("filter inheritance", () =>
	{
		it("should inherit filter functionality from BaseFilterService", () =>
		{
			const currentFilter: TestQueryRequest =
				service.getCurrentFilter();

			expect(currentFilter.page)
				.toBe(1);
			expect(currentFilter.pageSize)
				.toBe(25);
		});

		it("should support updateFilter", () =>
		{
			service.updateFilter({ pageSize: 50 });

			const filter: TestQueryRequest =
				service.getCurrentFilter();

			expect(filter.pageSize)
				.toBe(50);
			expect(filter.page)
				.toBe(1); // Reset to page 1
		});

		it("should support setPage", () =>
		{
			service.setPage(3);

			expect(service.getCurrentFilter().page)
				.toBe(3);
		});
	});
});
