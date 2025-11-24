import { signal } from "@angular/core";
import { BaseQueryRequest } from "@core/models";
import { BaseFilterService } from "./base-filter.service";

/**
 * Test implementation of BaseFilterService for testing purposes
 */
class TestFilterService extends BaseFilterService<BaseQueryRequest>
{
	constructor(initialFilter: BaseQueryRequest)
	{
		super(initialFilter);
	}

	clearFilters(): void
	{
		this.filter.set({
			pageNumber: 1,
			pageSize: 50
		});
	}

	// Expose protected filter for testing
	getFilterSignal()
	{
		return this.filter;
	}
}

describe("BaseFilterService", () =>
{
	let service: TestFilterService;
	const defaultFilter: BaseQueryRequest = {
		pageNumber: 1,
		pageSize: 50
	};

	beforeEach(() =>
	{
		service = new TestFilterService(defaultFilter);
	});

	describe("initialization", () =>
	{
		it("should initialize with default filter", () =>
		{
			const currentFilter: BaseQueryRequest = service.getCurrentFilter();

			expect(currentFilter.pageNumber).toBe(1);
			expect(currentFilter.pageSize).toBe(50);
		});
	});

	describe("getCurrentFilter", () =>
	{
		it("should return current filter state", () =>
		{
			const filter: BaseQueryRequest = service.getCurrentFilter();

			expect(filter).toEqual(defaultFilter);
		});
	});

	describe("updateFilter", () =>
	{
		it("should update filter properties", () =>
		{
			service.updateFilter({ searchTerm: "test" });

			const filter: BaseQueryRequest = service.getCurrentFilter();
			expect(filter.searchTerm).toBe("test");
		});

		it("should reset page number to 1 when updating filter", () =>
		{
			service.setPage(5);
			service.updateFilter({ searchTerm: "test" });

			const filter: BaseQueryRequest = service.getCurrentFilter();
			expect(filter.pageNumber).toBe(1);
		});

		it("should preserve existing filter properties", () =>
		{
			service.updateFilter({ searchTerm: "test" });
			service.updateFilter({ pageSize: 100 });

			const filter: BaseQueryRequest = service.getCurrentFilter();
			expect(filter.searchTerm).toBe("test");
			expect(filter.pageSize).toBe(100);
		});

		it("should handle date range updates", () =>
		{
			const startDate: Date = new Date("2025-01-01");
			const endDate: Date = new Date("2025-12-31");

			service.updateFilter({ startDate, endDate });

			const filter: BaseQueryRequest = service.getCurrentFilter();
			expect(filter.startDate).toBe(startDate);
			expect(filter.endDate).toBe(endDate);
		});
	});

	describe("setPage", () =>
	{
		it("should update page number", () =>
		{
			service.setPage(3);

			const filter: BaseQueryRequest = service.getCurrentFilter();
			expect(filter.pageNumber).toBe(3);
		});

		it("should preserve other filter properties", () =>
		{
			service.updateFilter({ searchTerm: "test", pageSize: 100 });
			service.setPage(2);

			const filter: BaseQueryRequest = service.getCurrentFilter();
			expect(filter.pageNumber).toBe(2);
			expect(filter.searchTerm).toBe("test");
			expect(filter.pageSize).toBe(100);
		});
	});

	describe("setPageSize", () =>
	{
		it("should update page size", () =>
		{
			service.setPageSize(100);

			const filter: BaseQueryRequest = service.getCurrentFilter();
			expect(filter.pageSize).toBe(100);
		});

		it("should reset page number to 1", () =>
		{
			service.setPage(5);
			service.setPageSize(100);

			const filter: BaseQueryRequest = service.getCurrentFilter();
			expect(filter.pageNumber).toBe(1);
			expect(filter.pageSize).toBe(100);
		});

		it("should preserve other filter properties", () =>
		{
			service.updateFilter({ searchTerm: "test" });
			service.setPageSize(25);

			const filter: BaseQueryRequest = service.getCurrentFilter();
			expect(filter.searchTerm).toBe("test");
			expect(filter.pageSize).toBe(25);
		});
	});

	describe("clearFilters", () =>
	{
		it("should reset filters to defaults", () =>
		{
			service.updateFilter({ searchTerm: "test", pageSize: 100 });
			service.setPage(5);
			service.clearFilters();

			const filter: BaseQueryRequest = service.getCurrentFilter();
			expect(filter.pageNumber).toBe(1);
			expect(filter.pageSize).toBe(50);
			expect(filter.searchTerm).toBeUndefined();
		});
	});

	describe("signal reactivity", () =>
	{
		it("should update signal when filter changes", () =>
		{
			const filterSignal = service.getFilterSignal();
			const initialValue: BaseQueryRequest = filterSignal();

			service.updateFilter({ searchTerm: "test" });
			const updatedValue: BaseQueryRequest = filterSignal();

			expect(updatedValue).not.toBe(initialValue);
			expect(updatedValue.searchTerm).toBe("test");
		});
	});
});
