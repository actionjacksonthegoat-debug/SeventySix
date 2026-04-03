import { describe, expect, it } from "vitest";
import { CountdownHelper, CountdownTickResult } from "./countdown.utility";

describe("CountdownHelper",
	() =>
	{
		it("should initialize with correct duration",
			() =>
			{
				const helper: CountdownHelper =
					new CountdownHelper(3);

				expect(helper.currentValue)
					.toBe(3);
				expect(helper.isComplete)
					.toBe(false);
				expect(helper.elapsed)
					.toBe(0);
				expect(helper.remaining)
					.toBe(3);
			});

		it("should not change value on sub-second updates",
			() =>
			{
				const helper: CountdownHelper =
					new CountdownHelper(3);

				const result: CountdownTickResult =
					helper.update(0.5);

				expect(result.valueChanged)
					.toBe(false);
				expect(result.completed)
					.toBe(false);
				expect(helper.currentValue)
					.toBe(3);
			});

		it("should decrement value after one second",
			() =>
			{
				const helper: CountdownHelper =
					new CountdownHelper(3);

				helper.update(0.5);

				const result: CountdownTickResult =
					helper.update(0.5);

				expect(result.valueChanged)
					.toBe(true);
				expect(result.completed)
					.toBe(false);
				expect(helper.currentValue)
					.toBe(2);
			});

		it("should count down from 3 to 0 with correct transitions",
			() =>
			{
				const helper: CountdownHelper =
					new CountdownHelper(3);

				const tick1: CountdownTickResult =
					helper.update(1.0);
				expect(tick1.valueChanged)
					.toBe(true);
				expect(tick1.completed)
					.toBe(false);
				expect(helper.currentValue)
					.toBe(2);

				const tick2: CountdownTickResult =
					helper.update(1.0);
				expect(tick2.valueChanged)
					.toBe(true);
				expect(tick2.completed)
					.toBe(false);
				expect(helper.currentValue)
					.toBe(1);

				const tick3: CountdownTickResult =
					helper.update(1.0);
				expect(tick3.valueChanged)
					.toBe(true);
				expect(tick3.completed)
					.toBe(true);
				expect(helper.currentValue)
					.toBe(0);
				expect(helper.isComplete)
					.toBe(true);
			});

		it("should return no-op results after completion",
			() =>
			{
				const helper: CountdownHelper =
					new CountdownHelper(1);

				helper.update(1.0);

				const result: CountdownTickResult =
					helper.update(1.0);

				expect(result.valueChanged)
					.toBe(false);
				expect(result.completed)
					.toBe(false);
				expect(helper.currentValue)
					.toBe(0);
			});

		it("should reset to initial state",
			() =>
			{
				const helper: CountdownHelper =
					new CountdownHelper(3);

				helper.update(1.0);
				helper.update(1.0);
				helper.reset();

				expect(helper.currentValue)
					.toBe(3);
				expect(helper.isComplete)
					.toBe(false);
				expect(helper.elapsed)
					.toBe(0);
			});

		it("should work correctly after reset",
			() =>
			{
				const helper: CountdownHelper =
					new CountdownHelper(2);

				helper.update(1.0);
				helper.update(1.0);
				expect(helper.isComplete)
					.toBe(true);

				helper.reset();

				const result: CountdownTickResult =
					helper.update(1.0);

				expect(result.valueChanged)
					.toBe(true);
				expect(result.completed)
					.toBe(false);
				expect(helper.currentValue)
					.toBe(1);
			});

		it("should accumulate fractional time correctly",
			() =>
			{
				const helper: CountdownHelper =
					new CountdownHelper(3);

				helper.update(0.3);
				helper.update(0.3);
				helper.update(0.3);

				expect(helper.currentValue)
					.toBe(3);

				helper.update(0.2);

				expect(helper.currentValue)
					.toBe(2);
			});

		it("should report remaining time including fractional accumulator",
			() =>
			{
				const helper: CountdownHelper =
					new CountdownHelper(3);

				helper.update(0.5);

				expect(helper.remaining)
					.toBe(2.5);
			});

		it("should clamp remaining to zero after completion",
			() =>
			{
				const helper: CountdownHelper =
					new CountdownHelper(1);

				helper.update(1.0);

				expect(helper.remaining)
					.toBe(0);
			});

		it("should handle multi-second deltas correctly",
			() =>
			{
				const helper: CountdownHelper =
					new CountdownHelper(3);

				const result: CountdownTickResult =
					helper.update(3.0);

				expect(result.valueChanged)
					.toBe(true);
				expect(result.completed)
					.toBe(true);
				expect(helper.currentValue)
					.toBe(0);
				expect(helper.isComplete)
					.toBe(true);
			});

		it("should handle partial multi-second delta skipping values",
			() =>
			{
				const helper: CountdownHelper =
					new CountdownHelper(5);

				const result: CountdownTickResult =
					helper.update(2.0);

				expect(result.valueChanged)
					.toBe(true);
				expect(result.completed)
					.toBe(false);
				expect(helper.currentValue)
					.toBe(3);
			});
	});