import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCart =
	vi.fn();
const mockStripeSessionCreate =
	vi.fn();
const mockDbSelect =
	vi.fn();
const mockDbInsert =
	vi.fn();

vi.mock("$lib/server/db/cart", () => ({
	getCart: mockGetCart
}));

vi.mock("$lib/server/db", () => ({
	db: {
		select: mockDbSelect,
		insert: mockDbInsert
	}
}));

vi.mock("$lib/server/db/schema", () => ({
	products: { id: "id", basePrice: "basePrice", isActive: "isActive" },
	checkoutSnapshots: { stripeSessionId: "stripeSessionId" }
}));

vi.mock("drizzle-orm", () => ({
	and: vi.fn(),
	eq: vi.fn(),
	inArray: vi.fn()
}));

vi.mock("$env/dynamic/private", () => ({
	env: {
		MOCK_SERVICES: "false",
		STRIPE_SECRET_KEY: "sk_test_fake",
		BASE_URL: "https://commerce-sveltekit.seventysixsandbox.com"
	}
}));

vi.mock("$lib/server/stripe", () => ({
	getStripe: () => ({
		checkout: {
			sessions: {
				create: mockStripeSessionCreate
			}
		}
	})
}));

vi.mock("@sveltejs/kit", () => ({
	fail: (status: number, body: Record<string, string>) => ({ status, body }),
	redirect: (status: number, url: string) =>
	{
		throw { status, location: url };
	}
}));

/** Sets up the mockDbSelect chain to return products for batch lookup. */
function setupDbSelectMock(basePrice: string, isActive: boolean = true): void
{
	const results: { id: string; basePrice: string; }[] =
		isActive ? [{ id: "p-1", basePrice }] : [];

	mockDbSelect.mockReturnValue(
		{
			from: vi
				.fn()
				.mockReturnValue(
					{
						where: vi
							.fn()
							.mockResolvedValue(results)
					})
		});
}

describe("Checkout",
	() =>
	{
		beforeEach(
			() =>
			{
				vi.clearAllMocks();
			});

		it("creates Stripe session with correct line items",
			async () =>
			{
				const cartItems =
					[
						{
							id: "ci-1",
							productId: "p-1",
							variantId: "v-1",
							quantity: 2,
							unitPrice: "29.99",
							productTitle: "Cosmic Drift Print",
							productSlug: "cosmic-drift-print",
							variantName: "8x10",
							imageUrl: "/images/cosmic-drift.jpg"
						}
					];
				mockGetCart.mockResolvedValue(cartItems);
				setupDbSelectMock("29.99");
				mockStripeSessionCreate.mockResolvedValue(
					{
						id: "cs_test_123",
						url: "https://checkout.stripe.com/session123"
					});
				mockDbInsert.mockReturnValue(
					{
						values: vi
							.fn()
							.mockResolvedValue(undefined)
					});

				const { actions } =
					await import("../../../routes/checkout/+page.server");

				try
				{
					await actions.default({
						locals: { cartSessionId: "sess-123" }
					} as never);
				}
				catch (e: unknown)
				{
					const err =
						e as { status: number; location: string; };
					expect(err.status)
						.toBe(303);
					expect(err.location)
						.toBe("https://checkout.stripe.com/session123");
				}

				expect(mockStripeSessionCreate)
					.toHaveBeenCalledOnce();
				const callArgs =
					mockStripeSessionCreate.mock.calls[0][0];
				expect(callArgs.mode)
					.toBe("payment");
				expect(callArgs.line_items)
					.toHaveLength(1);
				expect(callArgs.line_items[0].price_data.unit_amount)
					.toBe(2999);
				expect(callArgs.line_items[0].quantity)
					.toBe(2);
			});

		it("rejects empty cart",
			async () =>
			{
				mockGetCart.mockResolvedValue([]);

				const { actions } =
					await import("../../../routes/checkout/+page.server");

				const result =
					await actions.default({
						locals: { cartSessionId: "sess-empty" }
					} as never);

				expect(result)
					.toEqual(
						{
							status: 400,
							body: { error: "Cart is empty" }
						});
				expect(mockStripeSessionCreate).not.toHaveBeenCalled();
			});

		it("re-validates prices from database (not stale cart data)",
			async () =>
			{
				const cartItems =
					[
						{
							id: "ci-1",
							productId: "p-1",
							variantId: "v-1",
							quantity: 1,
							unitPrice: "45.00",
							productTitle: "Neon Horizon Print",
							productSlug: "neon-horizon-print",
							variantName: "11x14",
							imageUrl: "/images/neon-horizon.jpg"
						}
					];
				mockGetCart.mockResolvedValue(cartItems);
				// DB returns different price than cart's unitPrice — DB price should win
				setupDbSelectMock("39.99");
				mockStripeSessionCreate.mockResolvedValue(
					{
						url: "https://checkout.stripe.com/sess456"
					});

				const { actions } =
					await import("../../../routes/checkout/+page.server");

				try
				{
					await actions.default({
						locals: { cartSessionId: "sess-price" }
					} as never);
				}
				catch
				{
					// redirect expected
				}

				const callArgs =
					mockStripeSessionCreate.mock.calls[0][0];
				// Should use DB price (39.99) not stale cart price (45.00)
				expect(callArgs.line_items[0].price_data.unit_amount)
					.toBe(3999);
			});

		it("applies free shipping when subtotal >= $60",
			async () =>
			{
				const cartItems =
					[
						{
							id: "ci-1",
							productId: "p-1",
							variantId: "v-1",
							quantity: 3,
							unitPrice: "29.99",
							productTitle: "Test",
							productSlug: "test",
							variantName: "8x10",
							imageUrl: "/img.jpg"
						}
					];
				mockGetCart.mockResolvedValue(cartItems);
				setupDbSelectMock("29.99");
				mockStripeSessionCreate.mockResolvedValue(
					{
						url: "https://stripe.com/s"
					});

				const { actions } =
					await import("../../../routes/checkout/+page.server");

				try
				{
					await actions.default({
						locals: { cartSessionId: "sess-free" }
					} as never);
				}
				catch
				{
					// redirect
				}

				const callArgs =
					mockStripeSessionCreate.mock.calls[0][0];
				expect(
					callArgs.shipping_options[0].shipping_rate_data.fixed_amount.amount)
					.toBe(0);
				expect(
					callArgs.shipping_options[0].shipping_rate_data.display_name)
					.toBe("Free Shipping");
			});

		it("sets correct success and cancel URLs",
			async () =>
			{
				const cartItems =
					[
						{
							id: "ci-1",
							productId: "p-1",
							variantId: "v-1",
							quantity: 1,
							unitPrice: "20.00",
							productTitle: "Test",
							productSlug: "test",
							variantName: "8x10",
							imageUrl: "/img.jpg"
						}
					];
				mockGetCart.mockResolvedValue(cartItems);
				setupDbSelectMock("20.00");
				mockStripeSessionCreate.mockResolvedValue(
					{
						url: "https://stripe.com/s"
					});

				const { actions } =
					await import("../../../routes/checkout/+page.server");

				try
				{
					await actions.default({
						locals: { cartSessionId: "sess-urls" }
					} as never);
				}
				catch
				{
					// redirect
				}

				const callArgs =
					mockStripeSessionCreate.mock.calls[0][0];
				expect(callArgs.success_url)
					.toContain("/checkout/success?session_id=");
				expect(callArgs.cancel_url)
					.toContain("/cart");
			});

		it("includes cart session ID in metadata",
			async () =>
			{
				const cartItems =
					[
						{
							id: "ci-1",
							productId: "p-1",
							variantId: "v-1",
							quantity: 1,
							unitPrice: "20.00",
							productTitle: "Test",
							productSlug: "test",
							variantName: "8x10",
							imageUrl: "/img.jpg"
						}
					];
				mockGetCart.mockResolvedValue(cartItems);
				setupDbSelectMock("20.00");
				mockStripeSessionCreate.mockResolvedValue(
					{
						url: "https://stripe.com/s"
					});

				const { actions } =
					await import("../../../routes/checkout/+page.server");

				try
				{
					await actions.default({
						locals: { cartSessionId: "sess-meta-123" }
					} as never);
				}
				catch
				{
					// redirect
				}

				const callArgs =
					mockStripeSessionCreate.mock.calls[0][0];
				expect(callArgs.metadata.cartSessionId)
					.toBe("sess-meta-123");
			});

		it("rejects cart with only inactive products",
			async () =>
			{
				const cartItems =
					[
						{
							id: "ci-1",
							productId: "p-1",
							variantId: "v-1",
							quantity: 1,
							unitPrice: "20.00",
							productTitle: "Discontinued Print",
							productSlug: "discontinued",
							variantName: "8x10",
							imageUrl: "/img.jpg"
						}
					];
				mockGetCart.mockResolvedValue(cartItems);
				setupDbSelectMock("20.00", false);

				const { actions } =
					await import("../../../routes/checkout/+page.server");

				const result =
					await actions.default({
						locals: { cartSessionId: "sess-inactive" }
					} as never);

				expect(result)
					.toEqual(
						{
							status: 400,
							body: { error: "No active products in cart" }
						});
				expect(mockStripeSessionCreate).not.toHaveBeenCalled();
			});
	});