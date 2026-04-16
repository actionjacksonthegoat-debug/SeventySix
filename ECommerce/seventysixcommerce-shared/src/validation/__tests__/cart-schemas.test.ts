import { describe, expect, it } from "vitest";
import { addToCartFormSchema, addToCartSchema, removeCartItemSchema, updateCartItemSchema } from "../cart-schemas";

describe("addToCartSchema",
	() =>
	{
		it("rejects non-UUID productId",
			() =>
			{
				const result =
					addToCartSchema.safeParse(
						{
							productId: "not-a-uuid",
							variantId: "550e8400-e29b-41d4-a716-446655440000",
							quantity: 1
						});

				expect(result.success)
					.toBe(false);
			});

		it("rejects quantity exceeding MAX_CART_ITEM_QUANTITY",
			() =>
			{
				const result =
					addToCartSchema.safeParse(
						{
							productId: "550e8400-e29b-41d4-a716-446655440000",
							variantId: "550e8400-e29b-41d4-a716-446655440001",
							quantity: 99
						});

				expect(result.success)
					.toBe(false);
			});

		it("rejects quantity of 0",
			() =>
			{
				const result =
					addToCartSchema.safeParse(
						{
							productId: "550e8400-e29b-41d4-a716-446655440000",
							variantId: "550e8400-e29b-41d4-a716-446655440001",
							quantity: 0
						});

				expect(result.success)
					.toBe(false);
			});

		it("accepts valid input",
			() =>
			{
				const result =
					addToCartSchema.safeParse(
						{
							productId: "550e8400-e29b-41d4-a716-446655440000",
							variantId: "550e8400-e29b-41d4-a716-446655440001",
							quantity: 3
						});

				expect(result.success)
					.toBe(true);
			});
	});

describe("addToCartFormSchema",
	() =>
	{
		it("coerces string quantity to number",
			() =>
			{
				const result =
					addToCartFormSchema.safeParse(
						{
							productId: "550e8400-e29b-41d4-a716-446655440000",
							variantId: "550e8400-e29b-41d4-a716-446655440001",
							quantity: "5"
						});

				expect(result.success)
					.toBe(true);
				if (result.success)
				{
					expect(result.data.quantity)
						.toBe(5);
				}
			});
	});

describe("updateCartItemSchema",
	() =>
	{
		it("validates quantity range (0 to max)",
			() =>
			{
				const validZero =
					updateCartItemSchema.safeParse(
						{
							cartItemId: "550e8400-e29b-41d4-a716-446655440000",
							quantity: 0
						});

				expect(validZero.success)
					.toBe(true);

				const invalidNegative =
					updateCartItemSchema.safeParse(
						{
							cartItemId: "550e8400-e29b-41d4-a716-446655440000",
							quantity: -1
						});

				expect(invalidNegative.success)
					.toBe(false);
			});
	});

describe("removeCartItemSchema",
	() =>
	{
		it("rejects non-UUID cartItemId",
			() =>
			{
				const result =
					removeCartItemSchema.safeParse(
						{
							cartItemId: "invalid"
						});

				expect(result.success)
					.toBe(false);
			});

		it("accepts valid UUID",
			() =>
			{
				const result =
					removeCartItemSchema.safeParse(
						{
							cartItemId: "550e8400-e29b-41d4-a716-446655440000"
						});

				expect(result.success)
					.toBe(true);
			});
	});