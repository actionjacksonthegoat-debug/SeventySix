import { describe, expect, it } from "vitest";
import { addDays, currentYear, now } from "../date";

describe("date utility",
	() =>
	{
		it("now() should return a Date instance",
			() =>
			{
				const result =
					now();
				expect(result)
					.toBeInstanceOf(Date);
			});

		it("currentYear() should return the current year",
			() =>
			{
				const result =
					currentYear();
				expect(result)
					.toBe(new Date()
						.getFullYear());
			});

		it("addDays() should add the specified number of days",
			() =>
			{
				const start: Date =
					new Date(2025, 0, 1);
				const result: Date =
					addDays(start, 7);
				expect(result.getFullYear())
					.toBe(2025);
				expect(result.getMonth())
					.toBe(0);
				expect(result.getDate())
					.toBe(8);
			});
	});