import { DateRangeEvent, QuickFilter } from "@shared/models";
import { describe, expect, it } from "vitest";
import {
	DataTableFilterManager,
	FilterManagerConfig
} from "./filter.manager";

interface TestItem
{
	id: number;
	status: string;
}

describe("DataTableFilterManager",
	() =>
	{
		const mockQuickFilters: QuickFilter<TestItem>[] =
			[
				{
					key: "all",
					label: "All",
					icon: "list"
				},
				{
					key: "active",
					label: "Active",
					icon: "check"
				},
				{
					key: "inactive",
					label: "Inactive",
					icon: "close"
				}
			];

		describe("initialization",
			() =>
			{
				it("should initialize with default values",
					() =>
					{
						const manager: DataTableFilterManager<TestItem> =
							new DataTableFilterManager<TestItem>();

						expect(manager.activeFilters().size)
							.toBe(0);
						expect(manager.selectedDateRange())
							.toBe("24h");
						expect(manager.quickFilters)
							.toEqual([]);
						expect(manager.dateRangeEnabled)
							.toBe(false);
					});

				it("should initialize with custom config",
					() =>
					{
						const config: FilterManagerConfig<TestItem> =
							{
								quickFilters: mockQuickFilters,
								singleSelection: true,
								dateRangeEnabled: true,
								defaultDateRange: "7d"
							};

						const manager: DataTableFilterManager<TestItem> =
							new DataTableFilterManager<TestItem>(config);

						expect(manager.quickFilters)
							.toEqual(mockQuickFilters);
						expect(manager.dateRangeEnabled)
							.toBe(true);
						expect(manager.selectedDateRange())
							.toBe("7d");
					});
			});

		describe("toggleFilter",
			() =>
			{
				it("should activate filter when toggled on",
					() =>
					{
						const manager: DataTableFilterManager<TestItem> =
							new DataTableFilterManager<TestItem>(
								{ quickFilters: mockQuickFilters });

						const event: { filterKey: string; active: boolean; } =
							manager.toggleFilter("active");

						expect(event.filterKey)
							.toBe("active");
						expect(event.active)
							.toBe(true);
						expect(
							manager
								.activeFilters()
								.has("active"))
							.toBe(true);
					});

				it("should deactivate filter when toggled off",
					() =>
					{
						const manager: DataTableFilterManager<TestItem> =
							new DataTableFilterManager<TestItem>(
								{ quickFilters: mockQuickFilters });

						manager.toggleFilter("active");
						const event: { filterKey: string; active: boolean; } =
							manager.toggleFilter("active");

						expect(event.active)
							.toBe(false);
						expect(
							manager
								.activeFilters()
								.has("active"))
							.toBe(false);
					});

				it("should allow multiple filters in multi-selection mode",
					() =>
					{
						const manager: DataTableFilterManager<TestItem> =
							new DataTableFilterManager<TestItem>(
								{
									quickFilters: mockQuickFilters,
									singleSelection: false
								});

						manager.toggleFilter("active");
						manager.toggleFilter("inactive");

						expect(manager.activeFilters().size)
							.toBe(2);
						expect(
							manager
								.activeFilters()
								.has("active"))
							.toBe(true);
						expect(
							manager
								.activeFilters()
								.has("inactive"))
							.toBe(true);
					});

				it("should only allow one filter in single-selection mode",
					() =>
					{
						const manager: DataTableFilterManager<TestItem> =
							new DataTableFilterManager<TestItem>(
								{
									quickFilters: mockQuickFilters,
									singleSelection: true
								});

						manager.toggleFilter("active");
						manager.toggleFilter("inactive");

						expect(manager.activeFilters().size)
							.toBe(1);
						expect(
							manager
								.activeFilters()
								.has("inactive"))
							.toBe(true);
						expect(
							manager
								.activeFilters()
								.has("active"))
							.toBe(false);
					});
			});

		describe("activateFilter",
			() =>
			{
				it("should activate specific filter",
					() =>
					{
						const manager: DataTableFilterManager<TestItem> =
							new DataTableFilterManager<TestItem>(
								{ quickFilters: mockQuickFilters });

						manager.activateFilter("active");

						expect(manager.isFilterActive("active"))
							.toBe(true);
					});

				it("should replace filter in single-selection mode",
					() =>
					{
						const manager: DataTableFilterManager<TestItem> =
							new DataTableFilterManager<TestItem>(
								{
									quickFilters: mockQuickFilters,
									singleSelection: true
								});

						manager.activateFilter("active");
						manager.activateFilter("inactive");

						expect(manager.activeFilters().size)
							.toBe(1);
						expect(manager.isFilterActive("inactive"))
							.toBe(true);
					});
			});

		describe("isFilterActive",
			() =>
			{
				it("should return true for active filter",
					() =>
					{
						const manager: DataTableFilterManager<TestItem> =
							new DataTableFilterManager<TestItem>(
								{ quickFilters: mockQuickFilters });

						manager.toggleFilter("active");

						expect(manager.isFilterActive("active"))
							.toBe(true);
					});

				it("should return false for inactive filter",
					() =>
					{
						const manager: DataTableFilterManager<TestItem> =
							new DataTableFilterManager<TestItem>(
								{ quickFilters: mockQuickFilters });

						expect(manager.isFilterActive("active"))
							.toBe(false);
					});
			});

		describe("changeDateRange",
			() =>
			{
				it("should update selected date range",
					() =>
					{
						const manager: DataTableFilterManager<TestItem> =
							new DataTableFilterManager<TestItem>(
								{ dateRangeEnabled: true });

						manager.changeDateRange("7d");

						expect(manager.selectedDateRange())
							.toBe("7d");
					});

				it("should return null when date service not provided",
					() =>
					{
						const manager: DataTableFilterManager<TestItem> =
							new DataTableFilterManager<TestItem>(
								{ dateRangeEnabled: true });

						const result: DateRangeEvent | null =
							manager
								.changeDateRange("7d");

						expect(result)
							.toBeNull();
					});
			});

		describe("clearFilters",
			() =>
			{
				it("should clear all active filters",
					() =>
					{
						const manager: DataTableFilterManager<TestItem> =
							new DataTableFilterManager<TestItem>(
								{ quickFilters: mockQuickFilters });

						manager.toggleFilter("active");
						manager.toggleFilter("inactive");
						manager.clearFilters();

						expect(manager.activeFilters().size)
							.toBe(0);
					});
			});

		describe("initializeFirstFilter",
			() =>
			{
				it("should activate first filter in single-selection mode",
					() =>
					{
						const manager: DataTableFilterManager<TestItem> =
							new DataTableFilterManager<TestItem>(
								{
									quickFilters: mockQuickFilters,
									singleSelection: true
								});

						const event: { filterKey: string; active: boolean; } | null =
							manager.initializeFirstFilter();

						expect(event)
							.not
							.toBeNull();
						expect(event?.filterKey)
							.toBe("all");
						expect(manager.isFilterActive("all"))
							.toBe(true);
					});

				it("should return null in multi-selection mode",
					() =>
					{
						const manager: DataTableFilterManager<TestItem> =
							new DataTableFilterManager<TestItem>(
								{
									quickFilters: mockQuickFilters,
									singleSelection: false
								});

						const event: { filterKey: string; active: boolean; } | null =
							manager.initializeFirstFilter();

						expect(event)
							.toBeNull();
					});

				it("should return null when no quick filters",
					() =>
					{
						const manager: DataTableFilterManager<TestItem> =
							new DataTableFilterManager<TestItem>(
								{ singleSelection: true });

						const event: { filterKey: string; active: boolean; } | null =
							manager.initializeFirstFilter();

						expect(event)
							.toBeNull();
					});

				it("should return null when already initialized",
					() =>
					{
						const manager: DataTableFilterManager<TestItem> =
							new DataTableFilterManager<TestItem>(
								{
									quickFilters: mockQuickFilters,
									singleSelection: true
								});

						manager.initializeFirstFilter();
						const secondCall: { filterKey: string; active: boolean; } | null =
							manager.initializeFirstFilter();

						expect(secondCall)
							.toBeNull();
					});
			});

		describe("computed signals",
			() =>
			{
				it("should compute date range icon",
					() =>
					{
						const manager: DataTableFilterManager<TestItem> =
							new DataTableFilterManager<TestItem>(
								{
									dateRangeEnabled: true,
									defaultDateRange: "24h"
								});

						expect(manager.dateRangeIcon())
							.toBe("today");
					});

				it("should compute date range label",
					() =>
					{
						const manager: DataTableFilterManager<TestItem> =
							new DataTableFilterManager<TestItem>(
								{
									dateRangeEnabled: true,
									defaultDateRange: "7d"
								});

						expect(manager.dateRangeLabel())
							.toBe("7 Days");
					});
			});
	});
