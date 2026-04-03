import { distanceXZ } from "@games/shared/utilities/math.utility";
import { describe, expect, it } from "vitest";

describe("distanceXZ",
	() =>
	{
		it("should return 0 for identical points",
			() =>
			{
				expect(distanceXZ(3, 4, 3, 4))
					.toBe(0);
			});

		it("should compute distance for horizontal offset",
			() =>
			{
				expect(distanceXZ(0, 0, 3, 0))
					.toBe(3);
			});

		it("should compute distance for vertical offset",
			() =>
			{
				expect(distanceXZ(0, 0, 0, 4))
					.toBe(4);
			});

		it("should compute distance for diagonal offset",
			() =>
			{
				expect(distanceXZ(0, 0, 3, 4))
					.toBe(5);
			});

		it("should handle negative coordinates",
			() =>
			{
				expect(distanceXZ(-1, -1, 2, 3))
					.toBe(5);
			});

		it("should be commutative",
			() =>
			{
				const d1: number =
					distanceXZ(1, 2, 4, 6);
				const d2: number =
					distanceXZ(4, 6, 1, 2);

				expect(d1)
					.toBe(d2);
			});
	});