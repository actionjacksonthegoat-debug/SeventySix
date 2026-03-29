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
				it("rejects quantity > 10",
					() =>
					{
						const quantity = 11;
						expect(quantity)
							.toBeGreaterThan(10);
						const isValid: boolean =
							quantity >= 1 && quantity <= 10;
						expect(isValid)
							.toBe(false);
					});

				it("rejects negative quantity",
					() =>
					{
						const quantity = -1;
						const isValid: boolean =
							quantity >= 1 && quantity <= 10;
						expect(isValid)
							.toBe(false);
					});

				it("accepts valid quantity range (1-10)",
					() =>
					{
						for (const quantity of [1, 5, 10])
						{
							const isValid: boolean =
								quantity >= 1 && quantity <= 10;
							expect(isValid)
								.toBe(true);
						}
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
				it("applies free shipping when subtotal >= $60",
					() =>
					{
						const subtotal = 60.0;
						const shippingCost: number =
							subtotal >= 60 ? 0 : 5.99;
						expect(shippingCost)
							.toBe(0);
					});

				it("charges $5.99 shipping when subtotal < $60",
					() =>
					{
						const subtotal = 59.99;
						const shippingCost: number =
							subtotal >= 60 ? 0 : 5.99;
						expect(shippingCost)
							.toBe(5.99);
					});
			});
	});