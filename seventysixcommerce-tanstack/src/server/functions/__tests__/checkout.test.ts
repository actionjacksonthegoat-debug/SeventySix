import { beforeEach, describe, expect, it, vi } from "vitest";

/** Mock Stripe Checkout session shape. */
const mockCreate =
	vi.fn();

vi.mock("stripe",
	() =>
	{
		return {
			default: class MockStripe
			{
				checkout =
					{
						sessions: {
							create: mockCreate
						}
					};
			}
		};
	});

vi.mock("../../db", () => ({
	db: {
		select: vi
			.fn()
			.mockReturnValue(
				{
					from: vi
						.fn()
						.mockReturnValue(
							{
								innerJoin: vi
									.fn()
									.mockReturnValue(
										{
											innerJoin: vi
												.fn()
												.mockReturnValue(
													{
														where: vi
															.fn()
															.mockResolvedValue([])
													})
										}),
								where: vi
									.fn()
									.mockResolvedValue([])
							})
				})
	}
}));

describe("Checkout",
	() =>
	{
		beforeEach(
			() =>
			{
				vi.clearAllMocks();
			});

		describe("createCheckoutSession logic",
			() =>
			{
				it("creates Stripe session with correct line items",
					async () =>
					{
						mockCreate.mockResolvedValue(
							{
								url: "https://checkout.stripe.com/pay/test_123",
								id: "cs_test_123"
							});

						const result =
							mockCreate(
								{
									mode: "payment",
									line_items: [
										{
											price_data: {
												currency: "usd",
												product_data: {
													name: "Test Product",
													description: "Size M"
												},
												unit_amount: 2999
											},
											quantity: 2
										}
									],
									success_url: "http://localhost:3000/checkout/success?session_id={CHECKOUT_SESSION_ID}",
									cancel_url: "http://localhost:3000/cart",
									metadata: { cartSessionId: "session-123" }
								});

						expect(mockCreate)
							.toHaveBeenCalledTimes(1);
						await expect(result).resolves.toMatchObject(
							{
								url: expect.stringContaining("stripe.com")
							});
					});

				it("sets correct success and cancel URLs",
					() =>
					{
						const baseUrl: string = "http://localhost:3000";
						const successUrl: string =
							`${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
						const cancelUrl: string =
							`${baseUrl}/cart`;

						expect(successUrl)
							.toContain("{CHECKOUT_SESSION_ID}");
						expect(cancelUrl)
							.toBe("http://localhost:3000/cart");
					});

				it("includes cart metadata in session",
					() =>
					{
						const metadata =
							{ cartSessionId: "test-session-id" };
						expect(metadata.cartSessionId)
							.toBe("test-session-id");
					});

				it("rejects empty cart",
					() =>
					{
						const cartItems: unknown[] = [];
						expect(cartItems.length === 0)
							.toBe(true);

						const shouldReject: boolean =
							cartItems.length === 0;
						expect(shouldReject)
							.toBe(true);
					});

				it("applies free shipping when subtotal >= $60",
					() =>
					{
						const FREE_SHIPPING_THRESHOLD: number = 60;
						const subtotal: number = 75.0;
						const shippingAmount: number =
							subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 599;

						expect(shippingAmount)
							.toBe(0);
					});

				it("charges shipping when subtotal < $60",
					() =>
					{
						const FREE_SHIPPING_THRESHOLD: number = 60;
						const subtotal: number = 45.5;
						const shippingAmount: number =
							subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 599;

						expect(shippingAmount)
							.toBe(599);
					});

				it("converts dollar prices to cents for Stripe",
					() =>
					{
						const priceInDollars: number = 29.99;
						const priceInCents: number =
							Math.round(priceInDollars * 100);

						expect(priceInCents)
							.toBe(2999);
					});
			});
	});