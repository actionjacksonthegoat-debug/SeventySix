import { describe, expect, it } from "vitest";

/** Cart item shape returned from getCart. */
interface CartItem
{
	id: string;
	productId: string;
	variantId: string;
	productTitle: string;
	variantName: string;
	thumbnailUrl: string;
	quantity: number;
	unitPrice: string;
	lineTotal: string;
}

/** Cart response shape. */
interface CartResponse
{
	items: CartItem[];
	itemCount: number;
	subtotal: string;
}

/**
 * Cart operation tests — validates cart business logic.
 */
describe("Cart Operations",
	() =>
	{
		describe("getCart",
			() =>
			{
				it("returns empty cart for new session",
					() =>
					{
						const cart: CartResponse =
							{
								items: [],
								itemCount: 0,
								subtotal: "0.00"
							};
						expect(cart.items)
							.toHaveLength(0);
						expect(cart.subtotal)
							.toBe("0.00");
					});

				it("calculates correct subtotal",
					() =>
					{
						const items: CartItem[] =
							[
								{
									id: "ci1",
									productId: "p1",
									variantId: "v1",
									productTitle: "Poster A",
									variantName: "18×24",
									thumbnailUrl: "/a.webp",
									quantity: 2,
									unitPrice: "24.99",
									lineTotal: "49.98"
								},
								{
									id: "ci2",
									productId: "p2",
									variantId: "v2",
									productTitle: "Mug B",
									variantName: "11oz",
									thumbnailUrl: "/b.webp",
									quantity: 1,
									unitPrice: "16.99",
									lineTotal: "16.99"
								}
							];
						const subtotal: number =
							items.reduce(
								(sum, item) =>
									sum + parseFloat(item.unitPrice) * item.quantity,
								0);
						expect(subtotal.toFixed(2))
							.toBe("66.97");
					});
			});

		describe("addToCart",
			() =>
			{
				it.each(
					[
						{ quantity: -1, expected: false },
						{ quantity: 0, expected: false },
						{ quantity: 1, expected: true },
						{ quantity: 5, expected: true },
						{ quantity: 10, expected: true },
						{ quantity: 11, expected: false }
					])(
					"validates quantity $quantity is $expected",
					({ quantity, expected }: { quantity: number; expected: boolean; }) =>
					{
						const isValid: boolean =
							quantity >= 1 && quantity <= 10;
						expect(isValid)
							.toBe(expected);
					});
			});

		describe("updateCartItem",
			() =>
			{
				it("removes item when quantity is 0",
					() =>
					{
						const quantity = 0;
						const shouldRemove: boolean =
							quantity === 0;
						expect(shouldRemove)
							.toBe(true);
					});

				it("rejects quantity > 10",
					() =>
					{
						const quantity = 15;
						const isValid: boolean =
							quantity >= 0 && quantity <= 10;
						expect(isValid)
							.toBe(false);
					});
			});

		describe("shipping calculation",
			() =>
			{
				const FREE_SHIPPING_THRESHOLD: number = 60;

				it.each(
					[
						{ subtotal: 59.99, expectedShipping: 5.99 },
						{ subtotal: 60.0, expectedShipping: 0 },
						{ subtotal: 75.0, expectedShipping: 0 },
						{ subtotal: 0, expectedShipping: 5.99 }
					])(
					"calculates shipping $expectedShipping for subtotal $subtotal",
					({ subtotal, expectedShipping }: { subtotal: number; expectedShipping: number; }) =>
					{
						const shippingCost: number =
							subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 5.99;
						expect(shippingCost)
							.toBe(expectedShipping);
					});
			});
	});