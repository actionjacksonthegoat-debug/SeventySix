import { describe, expect, it } from "vitest";
import {
	formatTimerValue,
	formatTimerValuePadded,
	getTimerWarningClass
} from "./timer-display.utility";

describe("formatTimerValue",
	() =>
	{
		it("should format zero seconds as 0:00",
			() =>
			{
				expect(formatTimerValue(0))
					.toBe("0:00");
			});

		it("should format seconds under a minute",
			() =>
			{
				expect(formatTimerValue(30))
					.toBe("0:30");
			});

		it("should format single-digit seconds with padding",
			() =>
			{
				expect(formatTimerValue(65))
					.toBe("1:05");
			});

		it("should floor fractional seconds",
			() =>
			{
				expect(formatTimerValue(90.7))
					.toBe("1:30");
			});

		it("should format multiple minutes",
			() =>
			{
				expect(formatTimerValue(185))
					.toBe("3:05");
			});
	});

describe("formatTimerValuePadded",
	() =>
	{
		it("should format zero seconds as 00:00",
			() =>
			{
				expect(formatTimerValuePadded(0))
					.toBe("00:00");
			});

		it("should pad minutes under 10",
			() =>
			{
				expect(formatTimerValuePadded(65))
					.toBe("01:05");
			});

		it("should pad both minutes and seconds",
			() =>
			{
				expect(formatTimerValuePadded(5))
					.toBe("00:05");
			});

		it("should floor fractional seconds",
			() =>
			{
				expect(formatTimerValuePadded(90.999))
					.toBe("01:30");
			});
	});

describe("getTimerWarningClass",
	() =>
	{
		it("should return timer-ok above warning threshold",
			() =>
			{
				expect(getTimerWarningClass(90))
					.toBe("timer-ok");
			});

		it("should return timer-warning at warning threshold",
			() =>
			{
				expect(getTimerWarningClass(60))
					.toBe("timer-warning");
			});

		it("should return timer-warning between danger and warning",
			() =>
			{
				expect(getTimerWarningClass(45))
					.toBe("timer-warning");
			});

		it("should return timer-danger at danger threshold",
			() =>
			{
				expect(getTimerWarningClass(30))
					.toBe("timer-danger");
			});

		it("should return timer-danger below danger threshold",
			() =>
			{
				expect(getTimerWarningClass(10))
					.toBe("timer-danger");
			});

		it("should support custom thresholds",
			() =>
			{
				const thresholds: { danger: number; warning: number; } =
					{ danger: 10, warning: 20 };

				expect(getTimerWarningClass(25, thresholds))
					.toBe("timer-ok");
				expect(getTimerWarningClass(15, thresholds))
					.toBe("timer-warning");
				expect(getTimerWarningClass(5, thresholds))
					.toBe("timer-danger");
			});
	});