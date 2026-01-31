import {
	describe,
	expect,
	it
} from "vitest";

import { capitalize } from "./string.utility";

describe("capitalize",
	() =>
	{
		it("should capitalize the first letter of a word",
			() =>
			{
				expect(capitalize("hello"))
					.toBe("Hello");
			});

		it("should return empty string when given empty string",
			() =>
			{
				expect(capitalize(""))
					.toBe("");
			});

		it("should handle single character",
			() =>
			{
				expect(capitalize("a"))
					.toBe("A");
			});

		it("should not modify already capitalized strings",
			() =>
			{
				expect(capitalize("Hello"))
					.toBe("Hello");
			});

		it("should only capitalize first letter, leaving rest unchanged",
			() =>
			{
				expect(capitalize("hELLO"))
					.toBe("HELLO");
			});

		it("should handle strings with leading numbers",
			() =>
			{
				expect(capitalize("123abc"))
					.toBe("123abc");
			});

		it("should handle strings with special characters",
			() =>
			{
				expect(capitalize("@hello"))
					.toBe("@hello");
			});
	});
