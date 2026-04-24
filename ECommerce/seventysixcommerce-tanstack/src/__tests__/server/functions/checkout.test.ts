import { beforeEach, describe, expect, it, vi } from "vitest";

/** Cart product row shape returned from the DB join query. */
interface MockCartRow
{
	productId: string;
	variantId: string;
	quantity: number;
	productTitle: string;
	variantName: string;
	thumbnailUrl: string;
	currentPrice: string;
	isActive: boolean;
	isAvailable: boolean;
}

const mockDbSelect: ReturnType<typeof vi.fn> =
	vi.fn();
const mockStripeSessionCreate: ReturnType<typeof vi.fn> =
	vi.fn();
const mockBuildStripeLineItems: ReturnType<typeof vi.fn> =
	vi.fn();
const mockCalculateSubtotal: ReturnType<typeof vi.fn> =
	vi.fn();
const mockBuildShippingOptions: ReturnType<typeof vi.fn> =
	vi.fn();
const mockCreateCheckoutSnapshot: ReturnType<typeof vi.fn> =
	vi.fn();
const mockCreateMockOrder: ReturnType<typeof vi.fn> =
	vi.fn();
const mockQueueLog: ReturnType<typeof vi.fn> =
	vi.fn();

/** Builds the mock createServerFn chain that captures the handler function. */
function buildServerFnChain(): {
	middleware: ReturnType<typeof vi.fn>;
	inputValidator: ReturnType<typeof vi.fn>;
	handler: ReturnType<typeof vi.fn>;
}
{
	const handlerFn: ReturnType<typeof vi.fn> =
		vi
			.fn()
			.mockImplementation(
				(fn: unknown) => ({ _handler: fn }));
	const chain: {
		middleware: ReturnType<typeof vi.fn>;
		inputValidator: ReturnType<typeof vi.fn>;
		handler: ReturnType<typeof vi.fn>;
	} =
		{
			middleware: vi
				.fn()
				.mockImplementation(() => chain),
			inputValidator: vi
				.fn()
				.mockImplementation(() => chain),
			handler: handlerFn
		};

	return chain;
}

vi.mock(
	"@tanstack/react-start",
	() => (
		{
			createServerFn: vi
				.fn()
				.mockImplementation(
					() => buildServerFnChain())
		}));

vi.mock(
	"~/server/db",
	() => (
		{
			db: {
				select: mockDbSelect
			}
		}));

vi.mock(
	"~/server/db/schema",
	() => (
		{
			cartItems: { sessionId: "sessionId", productId: "productId", variantId: "variantId", quantity: "quantity" },
			products: {
				id: "id",
				title: "title",
				thumbnailUrl: "thumbnailUrl",
				basePrice: "basePrice",
				isActive: "isActive"
			},
			productVariants: { id: "id", name: "name", isAvailable: "isAvailable" }
		}));

vi.mock(
	"drizzle-orm",
	() => (
		{
			eq: vi
				.fn()
				.mockReturnValue("eq-condition")
		}));

vi.mock(
	"~/server/middleware/cart-session",
	() => (
		{
			cartSessionMiddleware: {}
		}));

vi.mock(
	"~/server/middleware/csrf",
	() => (
		{
			csrfMiddleware: {}
		}));

vi.mock(
	"~/server/log-forwarder",
	() => (
		{
			queueLog: mockQueueLog
		}));

vi.mock(
	"~/server/metrics",
	() => (
		{
			recordCheckoutStart: vi.fn(),
			recordCheckoutComplete: vi.fn()
		}));

vi.mock(
	"@seventysixcommerce/shared/checkout",
	() => (
		{
			buildStripeLineItems: mockBuildStripeLineItems,
			calculateSubtotal: mockCalculateSubtotal,
			buildShippingOptions: mockBuildShippingOptions,
			createCheckoutSnapshot: mockCreateCheckoutSnapshot,
			createMockOrder: mockCreateMockOrder
		}));

vi.mock(
	"@seventysixcommerce/shared/stripe",
	() => (
		{
			getStripe: vi
				.fn()
				.mockReturnValue(
					{
						checkout: {
							sessions: {
								create: mockStripeSessionCreate
							}
						}
					})
		}));

vi.mock(
	"@seventysixcommerce/shared/date",
	() => (
		{
			now: () => new Date("2025-01-01T00:00:00Z")
		}));

/** Configures the db.select chain to resolve with the given cart rows. */
function setupCartRowsMock(rows: MockCartRow[]): void
{
	mockDbSelect.mockReturnValue(
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
													.mockResolvedValue(rows)
											})
								})
					})
		});
}

/** Minimum context passed through middleware chain in checkout. */
const testContext: { cartSessionId: string; } =
	{
		cartSessionId: "checkout-session-uuid"
	};

/** A single available cart row returned from the DB join. */
const baseCartRow: MockCartRow =
	{
		productId: "prod-uuid-001",
		variantId: "var-uuid-001",
		quantity: 2,
		productTitle: "Cosmic Drift Print",
		variantName: "8x10",
		thumbnailUrl: "/images/cosmic-drift.jpg",
		currentPrice: "29.99",
		isActive: true,
		isAvailable: true
	};

describe("createCheckoutSession",
	() =>
	{
		beforeEach(
			() =>
			{
				vi.clearAllMocks();
				process.env.STRIPE_SECRET_KEY = "sk_test_fake";
				process.env.MOCK_SERVICES = "false";
				process.env.BASE_URL = "https://commerce.example.com";
				mockBuildStripeLineItems.mockReturnValue(
					[{ price_data: { unit_amount: 2999 }, quantity: 2 }]);
				mockCalculateSubtotal.mockReturnValue(59.98);
				mockBuildShippingOptions.mockReturnValue([]);
				mockCreateCheckoutSnapshot.mockResolvedValue(undefined);
			});

		it("createCheckoutSession_RejectsEmptyCart",
			async () =>
			{
				setupCartRowsMock([]);

				const { createCheckoutSession } =
					await import("../../../server/functions/checkout");

				const handler: (opts: { context: typeof testContext; }) => Promise<unknown> =
					(createCheckoutSession as unknown as {
						_handler: (opts: { context: typeof testContext; }) => Promise<unknown>;
					})
						._handler;

				await expect(
					handler(
						{ context: testContext }))
					.rejects
					.toThrow("Cart is empty");

				expect(mockStripeSessionCreate)
					.not
					.toHaveBeenCalled();
			});

		it("createCheckoutSession_RejectsUnavailableItems",
			async () =>
			{
				const unavailableRow: MockCartRow =
					{
						...baseCartRow,
						isAvailable: false
					};
				setupCartRowsMock(
					[unavailableRow]);

				const { createCheckoutSession } =
					await import("../../../server/functions/checkout");

				const handler: (opts: { context: typeof testContext; }) => Promise<unknown> =
					(createCheckoutSession as unknown as {
						_handler: (opts: { context: typeof testContext; }) => Promise<unknown>;
					})
						._handler;

				await expect(
					handler(
						{ context: testContext }))
					.rejects
					.toThrow();

				expect(mockStripeSessionCreate)
					.not
					.toHaveBeenCalled();
			});

		it("createCheckoutSession_RevalidatesPricesFromDatabase",
			async () =>
			{
				const dbPricedRow: MockCartRow =
					{
						...baseCartRow,
						currentPrice: "39.99"
					};
				setupCartRowsMock(
					[dbPricedRow]);

				mockStripeSessionCreate.mockResolvedValue(
					{
						id: "cs_test_001",
						url: "https://checkout.stripe.com/session001"
					});

				const { createCheckoutSession } =
					await import("../../../server/functions/checkout");

				const handler: (opts: { context: typeof testContext; }) => Promise<unknown> =
					(createCheckoutSession as unknown as {
						_handler: (opts: { context: typeof testContext; }) => Promise<unknown>;
					})
						._handler;

				await handler(
					{ context: testContext });

				expect(mockBuildStripeLineItems)
					.toHaveBeenCalledWith(
						expect.arrayContaining(
							[
								expect.objectContaining(
									{ currentPrice: "39.99" })
							]));
			});

		it("createCheckoutSession_ReturnsStripeSessionUrl_OnSuccess",
			async () =>
			{
				setupCartRowsMock(
					[baseCartRow]);

				mockStripeSessionCreate.mockResolvedValue(
					{
						id: "cs_test_002",
						url: "https://checkout.stripe.com/session002"
					});

				const { createCheckoutSession } =
					await import("../../../server/functions/checkout");

				const handler: (opts: { context: typeof testContext; }) => Promise<{ url: string; }> =
					(createCheckoutSession as unknown as {
						_handler: (opts: { context: typeof testContext; }) => Promise<{ url: string; }>;
					})
						._handler;

				const result: { url: string; } =
					await handler(
						{ context: testContext });

				expect(result.url)
					.toBe("https://checkout.stripe.com/session002");
			});
	});