import { setupSimpleServiceTest } from "@testing";
import { DateService } from "./date.service";

describe("DateService", () =>
{
	let service: DateService;

	beforeEach(() =>
	{
		service =
			setupSimpleServiceTest(DateService);
	});

	it("should be created", () =>
	{
		expect(service)
			.toBeTruthy();
	});

	describe("UTC Operations", () =>
	{
		it("now() should return ISO string", () =>
		{
			const now: string =
				service.now();
			expect(now)
				.toMatch(
					/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
		});

		it("toUTC() should convert Date to ISO string", () =>
		{
			const date: Date =
				new Date("2024-04-29T15:45:12.123Z");
			const utc: string =
				service.toUTC(date);
			expect(utc)
				.toBe("2024-04-29T15:45:12.123Z");
		});

		it("parseUTC() should parse ISO string to Date", () =>
		{
			const iso: string = "2024-04-29T15:45:12.123Z";
			const date: Date =
				service.parseUTC(iso);
			expect(date.toISOString())
				.toBe(iso);
		});
	});

	describe("Validation", () =>
	{
		it("isValid() should return true for valid date", () =>
		{
			expect(service.isValid(new Date()))
				.toBe(true);
			expect(service.isValid("2024-04-29T15:45:12.123Z"))
				.toBe(true);
		});

		it("isValid() should return false for invalid date", () =>
		{
			expect(service.isValid(null))
				.toBe(false);
			expect(service.isValid(undefined))
				.toBe(false);
			expect(service.isValid("invalid"))
				.toBe(false);
		});

		it("isBefore() should compare dates correctly", () =>
		{
			const earlier: Date =
				new Date("2024-04-29T00:00:00Z");
			const later: Date =
				new Date("2024-04-30T00:00:00Z");
			expect(service.isBefore(earlier, later))
				.toBe(true);
			expect(service.isBefore(later, earlier))
				.toBe(false);
		});

		it("isAfter() should compare dates correctly", () =>
		{
			const earlier: Date =
				new Date("2024-04-29T00:00:00Z");
			const later: Date =
				new Date("2024-04-30T00:00:00Z");
			expect(service.isAfter(later, earlier))
				.toBe(true);
			expect(service.isAfter(earlier, later))
				.toBe(false);
		});

		it("isSameDay() should compare calendar days correctly", () =>
		{
			const morning: Date =
				new Date("2024-04-29T08:00:00Z");
			const evening: Date =
				new Date("2024-04-29T20:00:00Z");
			const nextDay: Date =
				new Date("2024-04-30T08:00:00Z");

			expect(service.isSameDay(morning, evening))
				.toBe(true);
			expect(service.isSameDay(morning, nextDay))
				.toBe(false);
		});

		it("isPast() should check if date is before now", () =>
		{
			const pastDate: Date =
				new Date("2020-01-01T00:00:00Z");
			expect(service.isPast(pastDate))
				.toBe(true);
		});

		it("isFuture() should check if date is after now", () =>
		{
			const futureDate: Date =
				new Date("2030-01-01T00:00:00Z");
			expect(service.isFuture(futureDate))
				.toBe(true);
		});
	});

	describe("Date Arithmetic", () =>
	{
		it("addDays() should add days correctly", () =>
		{
			const start: Date =
				new Date("2024-04-29T00:00:00Z");
			const result: Date =
				service.addDays(start, 7);
			expect(result.toISOString())
				.toBe("2024-05-06T00:00:00.000Z");
		});

		it("addDays() should subtract days when count is negative", () =>
		{
			const start: Date =
				new Date("2024-04-29T00:00:00Z");
			const result: Date =
				service.addDays(start, -7);
			expect(result.toISOString())
				.toBe("2024-04-22T00:00:00.000Z");
		});

		it("addHours() should add hours correctly", () =>
		{
			const start: Date =
				new Date("2024-04-29T12:00:00Z");
			const result: Date =
				service.addHours(start, 6);
			expect(result.toISOString())
				.toBe("2024-04-29T18:00:00.000Z");
		});

		it("addHours() should subtract hours when count is negative", () =>
		{
			const start: Date =
				new Date("2024-04-29T12:00:00Z");
			const result: Date =
				service.addHours(start, -6);
			expect(result.toISOString())
				.toBe("2024-04-29T06:00:00.000Z");
		});

		it("differenceInDays() should calculate difference correctly", () =>
		{
			const start: Date =
				new Date("2024-04-29T00:00:00Z");
			const end: Date =
				new Date("2024-05-06T00:00:00Z");
			expect(service.differenceInDays(end, start))
				.toBe(7);
		});

		it("startOfDay() should return start of day in UTC", () =>
		{
			const date: Date =
				new Date("2024-04-29T15:45:12.123Z");
			const result: Date =
				service.startOfDay(date);
			expect(result.toISOString())
				.toBe("2024-04-29T00:00:00.000Z");
		});

		it("endOfDay() should return end of day in UTC", () =>
		{
			const date: Date =
				new Date("2024-04-29T15:45:12.123Z");
			const result: Date =
				service.endOfDay(date);
			expect(result.toISOString())
				.toBe("2024-04-29T23:59:59.999Z");
		});
	});

	describe("Helpers", () =>
	{
		it("hoursSince() should calculate hours correctly", () =>
		{
			const twoHoursAgo: Date =
				new Date(Date.now() - 2 * 3600000);
			const hours: number =
				service.hoursSince(twoHoursAgo);
			expect(hours)
				.toBe(2);
		});

		it("minutesSince() should calculate minutes correctly", () =>
		{
			const fiveMinutesAgo: Date =
				new Date(Date.now() - 5 * 60000);
			const minutes: number =
				service.minutesSince(fiveMinutesAgo);
			expect(minutes)
				.toBe(5);
		});

		it("formatRelative() should format relative time", () =>
		{
			const fiveMinutesAgo: Date =
				new Date(Date.now() - 5 * 60000);
			const relative: string =
				service.formatRelative(fiveMinutesAgo);
			expect(relative)
				.toContain("minute");
		});

		it("formatLocal() should format date in local timezone", () =>
		{
			const date: Date =
				new Date("2024-04-29T15:45:12.123Z");
			const formatted: string =
				service.formatLocal(date, "yyyy-MM-dd");
			expect(formatted)
				.toMatch(/^\d{4}-\d{2}-\d{2}$/);
		});

		it("formatLocal() should accept ISO string", () =>
		{
			const iso: string = "2024-04-29T15:45:12.123Z";
			const formatted: string =
				service.formatLocal(iso, "yyyy-MM-dd");
			expect(formatted)
				.toMatch(/^\d{4}-\d{2}-\d{2}$/);
		});
	});

	describe("Edge Cases", () =>
	{
		it("should handle ISO string inputs for date arithmetic", () =>
		{
			const iso: string = "2024-04-29T00:00:00Z";
			const result: Date =
				service.addDays(iso, 7);
			expect(result.toISOString())
				.toBe("2024-05-06T00:00:00.000Z");
		});

		it("should handle ISO string inputs for comparisons", () =>
		{
			const iso1: string = "2024-04-29T00:00:00Z";
			const iso2: string = "2024-04-30T00:00:00Z";
			expect(service.isBefore(iso1, iso2))
				.toBe(true);
			expect(service.isAfter(iso2, iso1))
				.toBe(true);
		});
	});
});
