import { describe, expect, it } from "vitest";
import {
	BRAND_NAME,
	BREVO_API_URL,
	CART_SESSION_COOKIE,
	CART_SESSION_MAX_AGE_SECONDS,
	DEFAULT_COUNTRY,
	FREE_SHIPPING_THRESHOLD,
	MAX_CART_ITEM_QUANTITY,
	MOCK_ORDER_EMAIL,
	PLACEHOLDER_CACHE_MAX_AGE,
	PLACEHOLDER_DEFAULT_SIZE,
	PLACEHOLDER_MAX_SIZE,
	PLACEHOLDER_MIN_SIZE,
	PRINTFUL_API_BASE_URL,
	STANDARD_SHIPPING_CENTS,
	STANDARD_SHIPPING_DOLLARS
} from "../constants";

describe("shared constants",
	() =>
	{
		it("CART_SESSION_COOKIE should be 'cart_session'",
			() =>
			{
				expect(CART_SESSION_COOKIE)
					.toBe("cart_session");
			});

		it("CART_SESSION_MAX_AGE_SECONDS should be 30 days in seconds",
			() =>
			{
				const thirtyDaysInSeconds: number =
					30 * 24 * 60 * 60;
				expect(CART_SESSION_MAX_AGE_SECONDS)
					.toBe(thirtyDaysInSeconds);
			});

		it("MAX_CART_ITEM_QUANTITY should be 10",
			() =>
			{
				expect(MAX_CART_ITEM_QUANTITY)
					.toBe(10);
			});

		it("BRAND_NAME should be 'SeventySixCommerce'",
			() =>
			{
				expect(BRAND_NAME)
					.toBe("SeventySixCommerce");
			});

		it("FREE_SHIPPING_THRESHOLD should be 60",
			() =>
			{
				expect(FREE_SHIPPING_THRESHOLD)
					.toBe(60);
			});

		it("STANDARD_SHIPPING_CENTS should be 599",
			() =>
			{
				expect(STANDARD_SHIPPING_CENTS)
					.toBe(599);
			});

		it("STANDARD_SHIPPING_DOLLARS should be 5.99",
			() =>
			{
				expect(STANDARD_SHIPPING_DOLLARS)
					.toBe(5.99);
			});

		it("placeholder dimensions should have valid range",
			() =>
			{
				expect(PLACEHOLDER_MIN_SIZE)
					.toBeLessThan(PLACEHOLDER_DEFAULT_SIZE);
				expect(PLACEHOLDER_DEFAULT_SIZE)
					.toBeLessThan(PLACEHOLDER_MAX_SIZE);
			});

		it("PLACEHOLDER_CACHE_MAX_AGE should be 24 hours",
			() =>
			{
				expect(PLACEHOLDER_CACHE_MAX_AGE)
					.toBe(86400);
			});

		it("BREVO_API_URL should be a valid HTTPS URL",
			() =>
			{
				expect(BREVO_API_URL)
					.toMatch(/^https:\/\//);
			});

		it("PRINTFUL_API_BASE_URL should be a valid HTTPS URL",
			() =>
			{
				expect(PRINTFUL_API_BASE_URL)
					.toMatch(/^https:\/\//);
			});

		it("DEFAULT_COUNTRY should be 'US'",
			() =>
			{
				expect(DEFAULT_COUNTRY)
					.toBe("US");
			});

		it("MOCK_ORDER_EMAIL should be a valid email format",
			() =>
			{
				expect(MOCK_ORDER_EMAIL)
					.toMatch(/.+@.+\..+/);
			});
	});