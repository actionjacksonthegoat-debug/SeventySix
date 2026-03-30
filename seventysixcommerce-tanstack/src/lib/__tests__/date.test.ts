import { describe, expect, it } from "vitest";
import { currentYear, futureDate, now } from "../date";

describe("date utility",
	() =>
	{
		it("now() should return a Date instance",
			() =>
			{
				const result: Date =
					now();
				expect(result)
					.toBeInstanceOf(Date);
			});

		it("currentYear() should return the current year",
			() =>
			{
				const result: number =
					currentYear();
				expect(result)
					.toBe(new Date()
						.getFullYear());
			});

		it("futureDate() should return a date in the future",
			() =>
			{
				const before: number =
					Date.now();
				const result: Date =
					futureDate(60);
				const after: number =
					Date.now();
				expect(result.getTime())
					.toBeGreaterThanOrEqual(before + 59_000);
				expect(result.getTime())
					.toBeLessThanOrEqual(after + 61_000);
			});
	});