import { describe, expect, it } from "vitest";
import {
	getTrackingUrl,
	verifyPrintfulSignature
} from "../../webhook/printful";

describe("verifyPrintfulSignature",
	() =>
	{
		it("returns true for a valid token",
			() =>
			{
				const result: boolean =
					verifyPrintfulSignature(
						"Bearer my-secret-token",
						"my-secret-token");

				expect(result)
					.toBe(true);
			});

		it("returns false for an invalid token",
			() =>
			{
				const result: boolean =
					verifyPrintfulSignature(
						"Bearer wrong-token-value",
						"my-secret-token");

				expect(result)
					.toBe(false);
			});

		it("returns false for a missing token",
			() =>
			{
				const result: boolean =
					verifyPrintfulSignature(
						null,
						"my-secret-token");

				expect(result)
					.toBe(false);
			});

		it("returns false when expected secret is empty",
			() =>
			{
				const result: boolean =
					verifyPrintfulSignature(
						"Bearer some-token",
						"");

				expect(result)
					.toBe(false);
			});

		it("returns false when authorization header is empty",
			() =>
			{
				const result: boolean =
					verifyPrintfulSignature(
						"",
						"my-secret-token");

				expect(result)
					.toBe(false);
			});
	});

describe("getTrackingUrl",
	() =>
	{
		it("returns USPS URL for usps carrier",
			() =>
			{
				const url: string =
					getTrackingUrl("usps", "9400111899223456789012");

				expect(url)
					.toBe(
						"https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223456789012");
			});

		it("returns USPS URL for USPS carrier (case insensitive)",
			() =>
			{
				const url: string =
					getTrackingUrl("USPS", "9400111899223456789012");

				expect(url)
					.toBe(
						"https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223456789012");
			});

		it("returns Google search URL for other carriers",
			() =>
			{
				const url: string =
					getTrackingUrl("FedEx", "123456789");

				expect(url)
					.toContain("https://www.google.com/search?q=FedEx+tracking+123456789");
			});
	});