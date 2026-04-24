import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** Mutable env object — individual tests override as needed. */
const mockEnv: Record<string, string | undefined> =
	{
		STRIPE_SECRET_KEY: "sk_test_key",
		BASE_URL: "https://localhost:3001",
		MOCK_SERVICES: "false"
	};

vi.mock("$env/dynamic/private", () => ({ env: mockEnv }));

const mockGetCart =
	vi.fn();
const mockDbSelect =
	vi.fn();
const mockCreateCheckoutSnapshot =
	vi.fn();
const mockCreateMockOrder =
	vi.fn();
const mockRecordCheckoutComplete =
	vi.fn();
const mockRecordCheckoutStart =
	vi.fn();
const mockQueueLog =
	vi.fn();
const mockSessionCreate =
	vi.fn();

vi.mock("$lib/server/db", () => (
	{
		db: {
			select: mockDbSelect
		}
	}));

vi.mock("$lib/server/db/cart", () => (
	{
		getCart: mockGetCart
	}));

vi.mock("$lib/server/db/schema", () => (
	{
		products: { id: "id", basePrice: "basePrice", isActive: "isActive" }
	}));

vi.mock("$lib/server/log-forwarder", () => (
	{
		queueLog: mockQueueLog
	}));

vi.mock("$lib/server/metrics", () => (
	{
		recordCheckoutComplete: mockRecordCheckoutComplete,
		recordCheckoutStart: mockRecordCheckoutStart
	}));

vi.mock("@seventysixcommerce/shared/checkout", () => (
	{
		buildShippingOptions: vi
			.fn()
			.mockReturnValue([]),
		buildStripeLineItems: vi
			.fn()
			.mockReturnValue([]),
		calculateSubtotal: vi
			.fn()
			.mockReturnValue(1000),
		createCheckoutSnapshot: mockCreateCheckoutSnapshot,
		createMockOrder: mockCreateMockOrder
	}));

vi.mock("@seventysixcommerce/shared/date", () => (
	{
		now: () => new Date("2025-01-01T00:00:00Z")
	}));

vi.mock("@seventysixcommerce/shared/stripe", () => (
	{
		getStripe: () => (
			{
				checkout: {
					sessions: {
						create: mockSessionCreate
					}
				}
			})
	}));

vi.mock("@seventysixcommerce/shared/utils", () => (
	{
		isNullOrUndefined: (value: unknown) =>
			value === null || value === undefined
	}));

vi.mock("@sveltejs/kit", () => (
	{
		fail: vi.fn((status: number, body: unknown) => ({ status, body })),
		redirect: vi.fn()
	}));

vi.mock("drizzle-orm", () => (
	{
		and: vi.fn(),
		eq: vi.fn(),
		inArray: vi.fn()
	}));

/** Cart item fixture for tests that need an active product in the cart. */
const CART_ITEM =
	{
		productId: "prod-1",
		variantId: "var-1",
		quantity: 1,
		productTitle: "Test Product",
		variantName: "Size M",
		imageUrl: "https://example.com/img.png"
	};

/**
 * Invokes the checkout default action with the given cart session ID.
 * @param cartSessionId The cart session identifier for the request locals.
 */
async function invokeDefault(cartSessionId: string): Promise<unknown>
{
	const { actions } =
		await import("../+page.server");

	return (actions as Record<string, (arg: unknown) => Promise<unknown>>)
		.default(
			{ locals: { cartSessionId } });
}

describe("checkout default action",
	() =>
	{
		beforeEach(
			() =>
			{
				vi.clearAllMocks();
				mockEnv.STRIPE_SECRET_KEY = "sk_test_key";
				mockEnv.BASE_URL = "https://localhost:3001";
				mockEnv.MOCK_SERVICES = "false";

				// Default: DB select returns active products for CART_ITEM
				mockDbSelect.mockReturnValue(
					{
						from: vi
							.fn()
							.mockReturnValue(
								{
									where: vi
										.fn()
										.mockResolvedValue(
											[{ id: "prod-1", basePrice: "10.00" }])
								})
					});
				mockCreateCheckoutSnapshot.mockResolvedValue(undefined);
				mockSessionCreate.mockResolvedValue(
					{
						id: "cs_test_123",
						url: "https://checkout.stripe.com/pay/cs_test_123",
						amount_total: 1000
					});
			});

		afterEach(
			() =>
			{
				vi.resetModules();
			});

		it("returns fail(400) when cart is empty",
			async () =>
			{
				mockGetCart.mockResolvedValue([]);

				const { fail } =
					await import("@sveltejs/kit");

				const result: unknown =
					await invokeDefault("session-1");

				expect(fail)
					.toHaveBeenCalledWith(400,
						{ error: "Cart is empty" });
				expect(result)
					.toMatchObject(
						{ status: 400 });
			});

		it("returns fail(400) when no active products are in cart",
			async () =>
			{
				mockGetCart.mockResolvedValue(
					[CART_ITEM]);
				// DB returns no active products
				mockDbSelect.mockReturnValue(
					{
						from: vi
							.fn()
							.mockReturnValue(
								{
									where: vi
										.fn()
										.mockResolvedValue([])
								})
					});

				const { fail } =
					await import("@sveltejs/kit");

				const result: unknown =
					await invokeDefault("session-2");

				expect(fail)
					.toHaveBeenCalledWith(400,
						{ error: "No active products in cart" });
				expect(result)
					.toMatchObject(
						{ status: 400 });
			});

		it("calls createMockOrder and recordCheckoutComplete in mock-services mode",
			async () =>
			{
				mockEnv.MOCK_SERVICES = "true";
				mockGetCart.mockResolvedValue(
					[CART_ITEM]);

				await invokeDefault("session-3");

				expect(mockCreateMockOrder)
					.toHaveBeenCalledWith(
						expect.anything(),
						"cs_test_123",
						1000,
						"session-3");
				expect(mockRecordCheckoutComplete)
					.toHaveBeenCalledOnce();
			});

		it("returns fail(500) when session URL is null",
			async () =>
			{
				mockGetCart.mockResolvedValue(
					[CART_ITEM]);
				mockSessionCreate.mockResolvedValue(
					{
						id: "cs_no_url",
						url: null,
						amount_total: 1000
					});

				const { fail } =
					await import("@sveltejs/kit");

				const result: unknown =
					await invokeDefault("session-4");

				expect(fail)
					.toHaveBeenCalledWith(500,
						{ error: "Checkout session creation failed" });
				expect(result)
					.toMatchObject(
						{ status: 500 });
			});

		it("calls redirect(303) with session URL on successful checkout",
			async () =>
			{
				mockGetCart.mockResolvedValue(
					[CART_ITEM]);

				const { redirect } =
					await import("@sveltejs/kit");

				await invokeDefault("session-5");

				expect(redirect)
					.toHaveBeenCalledWith(303, "https://checkout.stripe.com/pay/cs_test_123");
			});

		it("calls createCheckoutSnapshot with session id and cart session id",
			async () =>
			{
				mockGetCart.mockResolvedValue(
					[CART_ITEM]);

				await invokeDefault("session-6");

				expect(mockCreateCheckoutSnapshot)
					.toHaveBeenCalledWith(
						expect.anything(),
						"cs_test_123",
						"session-6",
						expect.any(Array));
			});
	});