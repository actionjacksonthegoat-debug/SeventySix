import { describe, expect, it } from "vitest";
import { type CartResponse, toCartResponse } from "../cart-response";
import type { CartItemRow } from "../index";

describe("toCartResponse",
	() =>
	{
		it("correctly aggregates items into CartResponse shape",
			() =>
			{
				const rows: CartItemRow[] =
					[
						{
							id: "item-1",
							productId: "prod-1",
							variantId: "var-1",
							quantity: 2,
							unitPrice: "29.99",
							productTitle: "Test Print",
							productSlug: "test-print",
							variantName: "8x10",
							imageUrl: "/images/test.jpg"
						}
					];

				const result: CartResponse =
					toCartResponse(rows);

				expect(result.items)
					.toHaveLength(1);
				expect(result.items[0].id)
					.toBe("item-1");
				expect(result.items[0].thumbnailUrl)
					.toBe("/images/test.jpg");
				expect(result.items[0].lineTotal)
					.toBe("59.98");
			});

		it("calculates correct subtotal and item count",
			() =>
			{
				const rows: CartItemRow[] =
					[
						{
							id: "item-1",
							productId: "prod-1",
							variantId: "var-1",
							quantity: 2,
							unitPrice: "10.00",
							productTitle: "Print A",
							productSlug: "print-a",
							variantName: "Small",
							imageUrl: "/a.jpg"
						},
						{
							id: "item-2",
							productId: "prod-2",
							variantId: "var-2",
							quantity: 1,
							unitPrice: "25.50",
							productTitle: "Print B",
							productSlug: "print-b",
							variantName: "Large",
							imageUrl: "/b.jpg"
						}
					];

				const result: CartResponse =
					toCartResponse(rows);

				expect(result.itemCount)
					.toBe(3);
				expect(result.subtotal)
					.toBe("45.50");
			});

		it("handles empty cart",
			() =>
			{
				const result: CartResponse =
					toCartResponse([]);

				expect(result.items)
					.toHaveLength(0);
				expect(result.itemCount)
					.toBe(0);
				expect(result.subtotal)
					.toBe("0.00");
			});
	});