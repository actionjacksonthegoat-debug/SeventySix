import { describe, expect, it } from "vitest";
import {
	buildShippingOptions,
	buildStripeLineItems,
	calculateSubtotal,
	type StripeLineItem,
	type StripeShippingOption,
	type ValidatedCartRow
} from "../index";

/** Helper to create a valid cart row with sensible defaults. */
function createRow(overrides: Partial<ValidatedCartRow> = {}): ValidatedCartRow
{
	return {
		productId: "00000000-0000-0000-0000-000000000001",
		variantId: "00000000-0000-0000-0000-000000000002",
		quantity: 1,
		productTitle: "Test Product",
		variantName: "Default",
		imageUrl: "https://example.com/image.jpg",
		currentPrice: "29.99",
		...overrides
	};
}

describe("buildStripeLineItems",
	() =>
	{
		it("should convert a single row to a Stripe line item",
			() =>
			{
				const rows: ValidatedCartRow[] =
					[createRow()];

				const result: StripeLineItem[] =
					buildStripeLineItems(rows);

				expect(result)
					.toHaveLength(1);
				expect(result[0].price_data.currency)
					.toBe("usd");
				expect(result[0].price_data.unit_amount)
					.toBe(2999);
				expect(result[0].price_data.product_data.name)
					.toBe("Test Product");
				expect(result[0].price_data.product_data.description)
					.toBe("Default");
				expect(result[0].price_data.product_data.images)
					.toEqual(
						["https://example.com/image.jpg"]);
				expect(result[0].quantity)
					.toBe(1);
			});

		it("should convert multiple rows",
			() =>
			{
				const rows: ValidatedCartRow[] =
					[
						createRow(
							{ currentPrice: "10.00", quantity: 2 }),
						createRow(
							{ currentPrice: "25.50", quantity: 1, productTitle: "Other" })
					];

				const result: StripeLineItem[] =
					buildStripeLineItems(rows);

				expect(result)
					.toHaveLength(2);
				expect(result[0].price_data.unit_amount)
					.toBe(1000);
				expect(result[0].quantity)
					.toBe(2);
				expect(result[1].price_data.unit_amount)
					.toBe(2550);
			});

		it("should round cents to avoid floating point issues",
			() =>
			{
				const rows: ValidatedCartRow[] =
					[createRow(
						{ currentPrice: "19.99" })];

				const result: StripeLineItem[] =
					buildStripeLineItems(rows);

				expect(result[0].price_data.unit_amount)
					.toBe(1999);
			});

		it("should handle empty rows array",
			() =>
			{
				const result: StripeLineItem[] =
					buildStripeLineItems([]);

				expect(result)
					.toEqual([]);
			});
	});

describe("buildShippingOptions",
	() =>
	{
		it("should return standard shipping below free threshold",
			() =>
			{
				const result: StripeShippingOption[] =
					buildShippingOptions(49.99);

				expect(result)
					.toHaveLength(1);
				expect(result[0].shipping_rate_data.fixed_amount.amount)
					.toBe(599);
				expect(result[0].shipping_rate_data.display_name)
					.toBe("Standard Shipping");
			});

		it("should return free shipping at threshold",
			() =>
			{
				const result: StripeShippingOption[] =
					buildShippingOptions(75);

				expect(result)
					.toHaveLength(1);
				expect(result[0].shipping_rate_data.fixed_amount.amount)
					.toBe(0);
				expect(result[0].shipping_rate_data.display_name)
					.toBe("Free Shipping");
			});

		it("should return free shipping above threshold",
			() =>
			{
				const result: StripeShippingOption[] =
					buildShippingOptions(100);

				expect(result[0].shipping_rate_data.fixed_amount.amount)
					.toBe(0);
			});

		it("should always use USD currency",
			() =>
			{
				const result: StripeShippingOption[] =
					buildShippingOptions(10);

				expect(result[0].shipping_rate_data.fixed_amount.currency)
					.toBe("usd");
			});

		it("should always use fixed_amount type",
			() =>
			{
				const result: StripeShippingOption[] =
					buildShippingOptions(10);

				expect(result[0].shipping_rate_data.type)
					.toBe("fixed_amount");
			});
	});

describe("calculateSubtotal",
	() =>
	{
		it("should calculate subtotal for a single item",
			() =>
			{
				const result: number =
					calculateSubtotal(
						[createRow(
							{ currentPrice: "29.99", quantity: 1 })]);

				expect(result)
					.toBeCloseTo(29.99);
			});

		it("should multiply price by quantity",
			() =>
			{
				const result: number =
					calculateSubtotal(
						[createRow(
							{ currentPrice: "10.00", quantity: 3 })]);

				expect(result)
					.toBe(30);
			});

		it("should sum multiple items",
			() =>
			{
				const rows: ValidatedCartRow[] =
					[
						createRow(
							{ currentPrice: "10.00", quantity: 2 }),
						createRow(
							{ currentPrice: "25.00", quantity: 1 })
					];

				const result: number =
					calculateSubtotal(rows);

				expect(result)
					.toBe(45);
			});

		it("should return 0 for empty rows",
			() =>
			{
				const result: number =
					calculateSubtotal([]);

				expect(result)
					.toBe(0);
			});
	});