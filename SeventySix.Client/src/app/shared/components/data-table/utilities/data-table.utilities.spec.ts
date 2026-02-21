import { DateRangeEvent } from "@shared/models";
import { DateService } from "@shared/services";
import { DataTableUtilities } from "./data-table.utility";

/**
 * Unit tests for DataTableUtilities.
 * Covers date range helpers, column preferences, and filter management.
 */
describe("DataTableUtilities",
	() =>
	{
		describe("getDateRangeIcon",
			() =>
			{
				it("should return schedule icon for 1h range",
					() =>
					{
						const icon: string =
							DataTableUtilities.getDateRangeIcon("1h");

						expect(icon)
							.toBe("schedule");
					});

				it("should return today icon for 24h range",
					() =>
					{
						const icon: string =
							DataTableUtilities.getDateRangeIcon("24h");

						expect(icon)
							.toBe("today");
					});

				it("should return date_range icon for 7d range",
					() =>
					{
						const icon: string =
							DataTableUtilities.getDateRangeIcon("7d");

						expect(icon)
							.toBe("date_range");
					});

				it("should return calendar_month icon for 30d range",
					() =>
					{
						const icon: string =
							DataTableUtilities.getDateRangeIcon("30d");

						expect(icon)
							.toBe("calendar_month");
					});

				it("should return default today icon for unknown range",
					() =>
					{
						const icon: string =
							DataTableUtilities.getDateRangeIcon("unknown");

						expect(icon)
							.toBe("today");
					});
			});

		describe("getDateRangeLabel",
			() =>
			{
				it("should return 1 Hour label for 1h range",
					() =>
					{
						const label: string =
							DataTableUtilities.getDateRangeLabel("1h");

						expect(label)
							.toBe("1 Hour");
					});

				it("should return 24 Hours label for 24h range",
					() =>
					{
						const label: string =
							DataTableUtilities.getDateRangeLabel("24h");

						expect(label)
							.toBe("24 Hours");
					});

				it("should return 7 Days label for 7d range",
					() =>
					{
						const label: string =
							DataTableUtilities.getDateRangeLabel("7d");

						expect(label)
							.toBe("7 Days");
					});

				it("should return 30 Days label for 30d range",
					() =>
					{
						const label: string =
							DataTableUtilities.getDateRangeLabel("30d");

						expect(label)
							.toBe("30 Days");
					});

				it("should return default 24 Hours label for unknown range",
					() =>
					{
						const label: string =
							DataTableUtilities.getDateRangeLabel("invalid");

						expect(label)
							.toBe("24 Hours");
					});
			});

		describe("calculateDateRange",
			() =>
			{
				const referenceTime: Date =
					new DateService()
						.parseUTC("2025-12-23T12:00:00.000Z");

				it("should return null for invalid range key",
					() =>
					{
						const result: DateRangeEvent | null =
							DataTableUtilities.calculateDateRange(
								"invalid",
								referenceTime,
								new DateService());
						expect(result)
							.toBeNull();
					});

				it("should calculate 1 hour range correctly",
					() =>
					{
						const result: DateRangeEvent | null =
							DataTableUtilities.calculateDateRange(
								"1h",
								referenceTime,
								new DateService());
						expect(result)
							.not
							.toBeNull();
						expect(result!.endDate)
							.toEqual(referenceTime);
						expect(result!.startDate!.getTime())
							.toBe(referenceTime.getTime() - 60 * 60 * 1000);
						expect(result!.preset)
							.toBe("24h");
					});

				it("should calculate 24 hour range correctly",
					() =>
					{
						const result: DateRangeEvent | null =
							DataTableUtilities.calculateDateRange("24h", referenceTime);

						expect(result)
							.not
							.toBeNull();
						expect(result!.endDate)
							.toEqual(referenceTime);
						expect(result!.startDate!.getTime())
							.toBe(referenceTime.getTime() - 24 * 60 * 60 * 1000);
						expect(result!.preset)
							.toBe("24h");
					});

				it("should calculate 7 day range correctly",
					() =>
					{
						const result: DateRangeEvent | null =
							DataTableUtilities.calculateDateRange("7d", referenceTime);

						expect(result)
							.not
							.toBeNull();
						expect(result!.endDate)
							.toEqual(referenceTime);
						expect(result!.startDate!.getTime())
							.toBe(referenceTime.getTime() - 7 * 24 * 60 * 60 * 1000);
						expect(result!.preset)
							.toBe("7d");
					});

				it("should calculate 30 day range correctly",
					() =>
					{
						const result: DateRangeEvent | null =
							DataTableUtilities.calculateDateRange("30d", referenceTime);

						expect(result)
							.not
							.toBeNull();
						expect(result!.endDate)
							.toEqual(referenceTime);
						expect(result!.startDate!.getTime())
							.toBe(referenceTime.getTime() - 30 * 24 * 60 * 60 * 1000);
						expect(result!.preset)
							.toBe("30d");
					});
			});

		describe("parseColumnPreferences",
			() =>
			{
				it("should parse valid JSON to Map",
					() =>
					{
						const json: string =
							JSON.stringify(
								{ name: true, email: false, status: true });

						const result: Map<string, boolean> | null =
							DataTableUtilities.parseColumnPreferences(json);

						expect(result)
							.not
							.toBeNull();
						expect(result!.get("name"))
							.toBe(true);
						expect(result!.get("email"))
							.toBe(false);
						expect(result!.get("status"))
							.toBe(true);
						expect(result!.size)
							.toBe(3);
					});

				it("should return null for invalid JSON",
					() =>
					{
						const result: Map<string, boolean> | null =
							DataTableUtilities.parseColumnPreferences("not valid json");

						expect(result)
							.toBeNull();
					});

				it("should filter out non-boolean values",
					() =>
					{
						const json: string =
							JSON.stringify(
								{
									name: true,
									email: "not-boolean",
									count: 42,
									status: false
								});

						const result: Map<string, boolean> | null =
							DataTableUtilities.parseColumnPreferences(json);

						expect(result)
							.not
							.toBeNull();
						expect(result!.size)
							.toBe(2);
						expect(result!.get("name"))
							.toBe(true);
						expect(result!.get("status"))
							.toBe(false);
						expect(result!.has("email"))
							.toBe(false);
						expect(result!.has("count"))
							.toBe(false);
					});

				it("should return empty Map for empty JSON object",
					() =>
					{
						const result: Map<string, boolean> | null =
							DataTableUtilities.parseColumnPreferences("{}");

						expect(result)
							.not
							.toBeNull();
						expect(result!.size)
							.toBe(0);
					});
			});

		describe("serializeColumnPreferences",
			() =>
			{
				it("should serialize Map to JSON string",
					() =>
					{
						const visibility: Map<string, boolean> =
							new Map(
								[
									["name", true],
									["email", false],
									["status", true]
								]);

						const result: string =
							DataTableUtilities.serializeColumnPreferences(visibility);
						const parsed: Record<string, boolean> =
							JSON.parse(result);

						expect(parsed["name"])
							.toBe(true);
						expect(parsed["email"])
							.toBe(false);
						expect(parsed["status"])
							.toBe(true);
					});

				it("should serialize empty Map to empty object",
					() =>
					{
						const visibility: Map<string, boolean> =
							new Map();

						const result: string =
							DataTableUtilities.serializeColumnPreferences(visibility);

						expect(result)
							.toBe("{}");
					});

				it("should round-trip with parseColumnPreferences",
					() =>
					{
						const original: Map<string, boolean> =
							new Map(
								[
									["col1", true],
									["col2", false],
									["col3", true]
								]);

						const serialized: string =
							DataTableUtilities.serializeColumnPreferences(original);
						const roundTrip: Map<string, boolean> | null =
							DataTableUtilities.parseColumnPreferences(serialized);

						expect(roundTrip)
							.not
							.toBeNull();
						expect(roundTrip!.size)
							.toBe(original.size);

						original.forEach(
							(value, key) =>
							{
								expect(roundTrip!.get(key))
									.toBe(value);
							});
					});
			});

		describe("updateFilters",
			() =>
			{
				it("should add filter when not present",
					() =>
					{
						const currentFilters: Set<string> =
							new Set(
								["filter1"]);

						const result: { active: boolean; filters: Set<string>; } =
							DataTableUtilities.updateFilters(
								currentFilters,
								"filter2",
								false);

						expect(result.active)
							.toBe(true);
						expect(result.filters.has("filter1"))
							.toBe(true);
						expect(result.filters.has("filter2"))
							.toBe(true);
						expect(result.filters.size)
							.toBe(2);
					});

				it("should remove filter when already present",
					() =>
					{
						const currentFilters: Set<string> =
							new Set(
								["filter1", "filter2"]);

						const result: { active: boolean; filters: Set<string>; } =
							DataTableUtilities.updateFilters(
								currentFilters,
								"filter2",
								false);

						expect(result.active)
							.toBe(false);
						expect(result.filters.has("filter1"))
							.toBe(true);
						expect(result.filters.has("filter2"))
							.toBe(false);
						expect(result.filters.size)
							.toBe(1);
					});

				it("should clear other filters in single-selection mode",
					() =>
					{
						const currentFilters: Set<string> =
							new Set(
								["filter1", "filter2"]);

						const result: { active: boolean; filters: Set<string>; } =
							DataTableUtilities.updateFilters(
								currentFilters,
								"filter3",
								true);

						expect(result.active)
							.toBe(true);
						expect(result.filters.has("filter1"))
							.toBe(false);
						expect(result.filters.has("filter2"))
							.toBe(false);
						expect(result.filters.has("filter3"))
							.toBe(true);
						expect(result.filters.size)
							.toBe(1);
					});

				it("should not modify original filter set",
					() =>
					{
						const currentFilters: Set<string> =
							new Set(
								["filter1"]);

						DataTableUtilities.updateFilters(currentFilters, "filter2", false);

						expect(currentFilters.size)
							.toBe(1);
						expect(currentFilters.has("filter1"))
							.toBe(true);
						expect(currentFilters.has("filter2"))
							.toBe(false);
					});

				it("should toggle off in single-selection mode when filter already active",
					() =>
					{
						const currentFilters: Set<string> =
							new Set(
								["filter1"]);

						const result: { active: boolean; filters: Set<string>; } =
							DataTableUtilities.updateFilters(
								currentFilters,
								"filter1",
								true);

						expect(result.active)
							.toBe(false);
						expect(result.filters.has("filter1"))
							.toBe(false);
						expect(result.filters.size)
							.toBe(0);
					});
			});
	});