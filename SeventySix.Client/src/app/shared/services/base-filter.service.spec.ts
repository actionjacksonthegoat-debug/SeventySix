import { HttpContext } from "@angular/common/http";
import { Signal, WritableSignal } from "@angular/core";
import { FORCE_REFRESH } from "@shared/interceptors/cache-bypass.interceptor";
import { BaseQueryRequest } from "@shared/models";
import { DateService } from "@shared/services";
import { BaseFilterService } from "./base-filter.service";

/**
 * Test implementation of BaseFilterService used by unit tests.
 */
class TestFilterService extends BaseFilterService<BaseQueryRequest>
{
	constructor(initialFilter: BaseQueryRequest)
	{
		super(initialFilter);
	}

	clearFilters(): void
	{
		this.filter.set(
			{
				page: 1,
				pageSize: 50
			});
	}

	// Expose protected members for testing
	getFilterSignal(): WritableSignal<BaseQueryRequest>
	{
		return this.filter;
	}

	override getForceRefreshContext(): HttpContext | undefined
	{
		return super.getForceRefreshContext();
	}

	override resetFilter(): void
	{
		super.resetFilter();
	}
}

describe("BaseFilterService",
	() =>
	{
		let service: TestFilterService;
		const defaultFilter: BaseQueryRequest =
			{
				page: 1,
				pageSize: 50
			};

		beforeEach(
			() =>
			{
				service =
					new TestFilterService(defaultFilter);
			});

		describe("initialization",
			() =>
			{
				it("should initialize with default filter",
					() =>
					{
						const currentFilter: BaseQueryRequest =
							service.getCurrentFilter();

						expect(currentFilter.page)
							.toBe(1);
						expect(currentFilter.pageSize)
							.toBe(50);
					});
			});

		describe("getCurrentFilter",
			() =>
			{
				it("should return current filter state",
					() =>
					{
						const filter: BaseQueryRequest =
							service.getCurrentFilter();

						expect(filter)
							.toEqual(defaultFilter);
					});
			});

		describe("updateFilter",
			() =>
			{
				it("should update filter properties",
					() =>
					{
						service.updateFilter(
							{ searchTerm: "test" });

						const filter: BaseQueryRequest =
							service.getCurrentFilter();
						expect(filter.searchTerm)
							.toBe("test");
					});

				it("should reset page to 1 when updating filter",
					() =>
					{
						service.setPage(5);
						service.updateFilter(
							{ searchTerm: "test" });

						const filter: BaseQueryRequest =
							service.getCurrentFilter();
						expect(filter.page)
							.toBe(1);
					});

				it("should preserve existing filter properties",
					() =>
					{
						service.updateFilter(
							{ searchTerm: "test" });
						service.updateFilter(
							{ pageSize: 100 });

						const filter: BaseQueryRequest =
							service.getCurrentFilter();
						expect(filter.searchTerm)
							.toBe("test");
						expect(filter.pageSize)
							.toBe(100);
					});

				it("should handle date range updates",
					() =>
					{
						const dateService: DateService =
							new DateService();
						const startDate: Date =
							dateService.parseUTC("2025-01-01");
						const endDate: Date =
							dateService.parseUTC("2025-12-31");

						service.updateFilter(
							{ startDate, endDate });

						const filter: BaseQueryRequest =
							service.getCurrentFilter();
						expect(filter.startDate)
							.toBe(startDate);
						expect(filter.endDate)
							.toBe(endDate);
					});
			});

		describe("setPage",
			() =>
			{
				it("should update page",
					() =>
					{
						service.setPage(3);

						const filter: BaseQueryRequest =
							service.getCurrentFilter();
						expect(filter.page)
							.toBe(3);
					});

				it("should preserve other filter properties",
					() =>
					{
						service.updateFilter(
							{ searchTerm: "test", pageSize: 100 });
						service.setPage(2);

						const filter: BaseQueryRequest =
							service.getCurrentFilter();
						expect(filter.page)
							.toBe(2);
						expect(filter.searchTerm)
							.toBe("test");
						expect(filter.pageSize)
							.toBe(100);
					});
			});

		describe("setPageSize",
			() =>
			{
				it("should update page size",
					() =>
					{
						service.setPageSize(100);

						const filter: BaseQueryRequest =
							service.getCurrentFilter();
						expect(filter.pageSize)
							.toBe(100);
					});

				it("should reset page to 1",
					() =>
					{
						service.setPage(5);
						service.setPageSize(100);

						const filter: BaseQueryRequest =
							service.getCurrentFilter();
						expect(filter.page)
							.toBe(1);
						expect(filter.pageSize)
							.toBe(100);
					});

				it("should preserve other filter properties",
					() =>
					{
						service.updateFilter(
							{ searchTerm: "test" });
						service.setPageSize(25);

						const filter: BaseQueryRequest =
							service.getCurrentFilter();
						expect(filter.searchTerm)
							.toBe("test");
						expect(filter.pageSize)
							.toBe(25);
					});
			});

		describe("clearFilters",
			() =>
			{
				it("should reset filters to defaults",
					() =>
					{
						service.updateFilter(
							{ searchTerm: "test", pageSize: 100 });
						service.setPage(5);
						service.clearFilters();

						const filter: BaseQueryRequest =
							service.getCurrentFilter();
						expect(filter.page)
							.toBe(1);
						expect(filter.pageSize)
							.toBe(50);
						expect(filter.searchTerm)
							.toBeUndefined();
					});
			});

		describe("signal reactivity",
			() =>
			{
				it("should update signal when filter changes",
					() =>
					{
						const filterSignal: Signal<BaseQueryRequest> =
							service.getFilterSignal();
						const initialValue: BaseQueryRequest =
							filterSignal();

						service.updateFilter(
							{ searchTerm: "test" });
						const updatedValue: BaseQueryRequest =
							filterSignal();

						expect(updatedValue).not.toBe(initialValue);
						expect(updatedValue.searchTerm)
							.toBe("test");
					});
			});

		describe("forceRefresh",
			() =>
			{
				it("should increment forceRefreshTrigger counter",
					async () =>
					{
						const initialValue: number =
							service["forceRefreshTrigger"]();

						await service.forceRefresh();

						expect(service["forceRefreshTrigger"]())
							.toBe(initialValue + 1);
					});

				it("should continue incrementing on subsequent calls",
					async () =>
					{
						const initialValue: number =
							service["forceRefreshTrigger"]();

						await service.forceRefresh();
						await service.forceRefresh();

						expect(service["forceRefreshTrigger"]())
							.toBe(initialValue + 2);
					});
			});

		describe("getForceRefreshContext",
			() =>
			{
				it("should return undefined when forceRefreshTrigger is zero",
					() =>
					{
						service["forceRefreshTrigger"].set(0);

						const context: HttpContext | undefined =
							service.getForceRefreshContext();

						expect(context)
							.toBeUndefined();
					});

				it("should return HttpContext with FORCE_REFRESH when trigger is non-zero",
					() =>
					{
						service["forceRefreshTrigger"].set(1);

						const context: HttpContext | undefined =
							service.getForceRefreshContext();

						expect(context)
							.toBeInstanceOf(HttpContext);
						expect(context?.get(FORCE_REFRESH))
							.toBe(true);
					});
			});

		describe("resetFilter",
			() =>
			{
				it("should reset filter to initial state",
					() =>
					{
						service.updateFilter(
							{ searchTerm: "test", pageSize: 100 });
						service.setPage(5);

						service.resetFilter();

						const filter: BaseQueryRequest =
							service.getCurrentFilter();
						expect(filter)
							.toEqual(defaultFilter);
						expect(filter.page)
							.toBe(1);
						expect(filter.pageSize)
							.toBe(50);
						expect(filter.searchTerm)
							.toBeUndefined();
					});

				it("should restore initial filter values",
					() =>
					{
						const customInitialFilter: BaseQueryRequest =
							{
								page: 2,
								pageSize: 25,
								searchTerm: "initial"
							};
						const customService: TestFilterService =
							new TestFilterService(customInitialFilter);

						customService.updateFilter(
							{ searchTerm: "changed", pageSize: 100 });

						customService.resetFilter();

						const filter: BaseQueryRequest =
							customService.getCurrentFilter();
						expect(filter)
							.toEqual(customInitialFilter);
					});
			});
	});
