import { DateService } from "@shared/services";
import {
	DateRangePreset,
	getDateRangeFromPreset,
	getDateRangePresetLabel
} from "./log-filter.model";

describe("Log Filter Model",
	() =>
	{
		let dateService: DateService;

		beforeEach(
			() =>
			{
				dateService =
					new DateService();
			});

		describe("getDateRangeFromPreset",
			() =>
			{
				it("should return 1 hour range for Last1Hour preset",
					() =>
					{
						const before: number =
							Date.now();
						const result: { startDate: Date | null; endDate: Date | null; } =
							getDateRangeFromPreset(
								DateRangePreset.Last1Hour,
								dateService);
						const after: number =
							Date.now();

						expect(result.endDate)
							.toBeDefined();
						expect(result.startDate)
							.toBeDefined();

						if (result.startDate && result.endDate)
						{
							const hourDiff: number =
								(result.endDate.getTime() - result.startDate.getTime())
									/ (1000 * 60 * 60);
							expect(hourDiff)
								.toBeCloseTo(1, 0);
							expect(result.endDate.getTime())
								.toBeGreaterThanOrEqual(before);
							expect(result.endDate.getTime())
								.toBeLessThanOrEqual(after);
						}
					});

				it("should return 6 hours range for Last6Hours preset",
					() =>
					{
						const result: { startDate: Date | null; endDate: Date | null; } =
							getDateRangeFromPreset(
								DateRangePreset.Last6Hours,
								dateService);

						expect(result.endDate)
							.toBeDefined();
						expect(result.startDate)
							.toBeDefined();

						if (result.startDate && result.endDate)
						{
							const hourDiff: number =
								(result.endDate.getTime() - result.startDate.getTime())
									/ (1000 * 60 * 60);
							expect(hourDiff)
								.toBeCloseTo(6, 0);
						}
					});

				it("should return 24 hours range for Last24Hours preset",
					() =>
					{
						const result: { startDate: Date | null; endDate: Date | null; } =
							getDateRangeFromPreset(
								DateRangePreset.Last24Hours,
								dateService);

						expect(result.endDate)
							.toBeDefined();
						expect(result.startDate)
							.toBeDefined();

						if (result.startDate && result.endDate)
						{
							const hourDiff: number =
								(result.endDate.getTime() - result.startDate.getTime())
									/ (1000 * 60 * 60);
							expect(hourDiff)
								.toBeCloseTo(24, 0);
						}
					});

				it("should return 7 days range for Last7Days preset",
					() =>
					{
						const result: { startDate: Date | null; endDate: Date | null; } =
							getDateRangeFromPreset(
								DateRangePreset.Last7Days,
								dateService);

						expect(result.endDate)
							.toBeDefined();
						expect(result.startDate)
							.toBeDefined();

						if (result.startDate && result.endDate)
						{
							const dayDiff: number =
								(result.endDate.getTime() - result.startDate.getTime())
									/ (1000 * 60 * 60 * 24);
							expect(dayDiff)
								.toBeCloseTo(7, 0);
						}
					});

				it("should return 30 days range for Last30Days preset",
					() =>
					{
						const result: { startDate: Date | null; endDate: Date | null; } =
							getDateRangeFromPreset(
								DateRangePreset.Last30Days,
								dateService);

						expect(result.endDate)
							.toBeDefined();
						expect(result.startDate)
							.toBeDefined();

						if (result.startDate && result.endDate)
						{
							const dayDiff: number =
								(result.endDate.getTime() - result.startDate.getTime())
									/ (1000 * 60 * 60 * 24);
							expect(dayDiff)
								.toBeCloseTo(30, 0);
						}
					});

				it("should return null dates for Custom preset",
					() =>
					{
						const result: { startDate: Date | null; endDate: Date | null; } =
							getDateRangeFromPreset(
								DateRangePreset.Custom,
								dateService);

						expect(result.startDate)
							.toBeNull();
						expect(result.endDate)
							.toBeNull();
					});

				it("should return null dates for invalid preset",
					() =>
					{
						const result: { startDate: Date | null; endDate: Date | null; } =
							getDateRangeFromPreset(
								"invalid" as DateRangePreset,
								dateService);

						expect(result.startDate)
							.toBeNull();
						expect(result.endDate)
							.toBeNull();
					});
			});

		describe("getDateRangePresetLabel",
			() =>
			{
				it("should return 'Last 1 Hour' for Last1Hour preset",
					() =>
					{
						expect(getDateRangePresetLabel(DateRangePreset.Last1Hour))
							.toBe(
								"Last 1 Hour");
					});

				it("should return 'Last 6 Hours' for Last6Hours preset",
					() =>
					{
						expect(getDateRangePresetLabel(DateRangePreset.Last6Hours))
							.toBe(
								"Last 6 Hours");
					});

				it("should return 'Last 24 Hours' for Last24Hours preset",
					() =>
					{
						expect(getDateRangePresetLabel(DateRangePreset.Last24Hours))
							.toBe(
								"Last 24 Hours");
					});

				it("should return 'Last 7 Days' for Last7Days preset",
					() =>
					{
						expect(getDateRangePresetLabel(DateRangePreset.Last7Days))
							.toBe(
								"Last 7 Days");
					});

				it("should return 'Last 30 Days' for Last30Days preset",
					() =>
					{
						expect(getDateRangePresetLabel(DateRangePreset.Last30Days))
							.toBe(
								"Last 30 Days");
					});

				it("should return 'Custom Range' for Custom preset",
					() =>
					{
						expect(getDateRangePresetLabel(DateRangePreset.Custom))
							.toBe(
								"Custom Range");
					});

				it("should return 'All Time' for invalid preset",
					() =>
					{
						expect(getDateRangePresetLabel("invalid" as DateRangePreset))
							.toBe(
								"All Time");
					});
			});
	});
