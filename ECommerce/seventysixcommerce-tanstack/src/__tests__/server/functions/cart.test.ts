import { beforeEach, describe, expect, it, vi } from "vitest";

/** Shared mock references for shared cart functions. */
const mockSharedAddToCart: ReturnType<typeof vi.fn> =
	vi.fn();
const mockGetCartItems: ReturnType<typeof vi.fn> =
	vi.fn();
const mockRemoveCartItem: ReturnType<typeof vi.fn> =
	vi.fn();
const mockUpdateCartItemQuantity: ReturnType<typeof vi.fn> =
	vi.fn();
const mockToCartResponse: ReturnType<typeof vi.fn> =
	vi.fn();
const mockQueueLog: ReturnType<typeof vi.fn> =
	vi.fn();
const mockRecordCartAdd: ReturnType<typeof vi.fn> =
	vi.fn();
const mockRecordCartRemove: ReturnType<typeof vi.fn> =
	vi.fn();

/** Builds the mock createServerFn chain that captures the handler. */
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
	"@seventysixcommerce/shared/cart",
	() => (
		{
			addToCart: mockSharedAddToCart,
			getCartItems: mockGetCartItems,
			removeCartItem: mockRemoveCartItem,
			updateCartItemQuantity: mockUpdateCartItemQuantity,
			toCartResponse: mockToCartResponse
		}));

vi.mock(
	"~/server/db",
	() => (
		{
			db: {}
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
			recordCartAdd: mockRecordCartAdd,
			recordCartRemove: mockRecordCartRemove
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
	"@seventysixcommerce/shared/date",
	() => (
		{
			futureDate: vi
				.fn()
				.mockReturnValue(new Date("2026-01-01"))
		}));

vi.mock(
	"~/lib/constants",
	() => (
		{
			CART_SESSION_MAX_AGE_SECONDS: 2592000
		}));

/** Minimum context passed through cart session middleware. */
const testContext: { cartSessionId: string; } =
	{
		cartSessionId: "test-session-uuid"
	};

/** Minimal cart response for mock returns. */
const mockCartResponseValue: { items: unknown[]; itemCount: number; subtotal: string; } =
	{
		items: [],
		itemCount: 0,
		subtotal: "0.00"
	};

describe("TanStack cart server functions",
	() =>
	{
		beforeEach(
			() =>
			{
				vi.clearAllMocks();
				mockGetCartItems.mockResolvedValue([]);
				mockToCartResponse.mockReturnValue(mockCartResponseValue);
			});

		describe("getCart",
			() =>
			{
				it("getCart_ReturnsCartResponse",
					async () =>
					{
						const { getCart } =
							await import("../../../server/functions/cart");

						const handler: (opts: { context: typeof testContext; }) => Promise<unknown> =
							(getCart as unknown as {
								_handler: (opts: { context: typeof testContext; }) => Promise<unknown>;
							})
								._handler;

						const result: unknown =
							await handler(
								{ context: testContext });

						expect(mockGetCartItems)
							.toHaveBeenCalledOnce();
						expect(mockToCartResponse)
							.toHaveBeenCalledOnce();
						expect(result)
							.toBe(mockCartResponseValue);
					});
			});

		describe("addToCart",
			() =>
			{
				it("addToCart_CallsSharedAddToCart_WithSessionId",
					async () =>
					{
						mockSharedAddToCart.mockResolvedValue(
							{ success: true });

						const { addToCart } =
							await import("../../../server/functions/cart");

						const handler: (opts: {
							data: { productId: string; variantId: string; quantity: number; };
							context: typeof testContext;
						}) => Promise<unknown> =
							(addToCart as unknown as {
								_handler: (opts: {
									data: { productId: string; variantId: string; quantity: number; };
									context: typeof testContext;
								}) => Promise<unknown>;
							})
								._handler;

						await handler(
							{
								data: {
									productId: "prod-uuid-001",
									variantId: "var-uuid-001",
									quantity: 2
								},
								context: testContext
							});

						expect(mockSharedAddToCart)
							.toHaveBeenCalledWith(
								{},
								"test-session-uuid",
								"prod-uuid-001",
								"var-uuid-001",
								2,
								expect.any(Date));
					});

				it("addToCart_ThrowsError_WhenAddFails",
					async () =>
					{
						mockSharedAddToCart.mockResolvedValue(
							{ success: false, error: "Out of stock" });

						const { addToCart } =
							await import("../../../server/functions/cart");

						const handler: (opts: {
							data: { productId: string; variantId: string; quantity: number; };
							context: typeof testContext;
						}) => Promise<unknown> =
							(addToCart as unknown as {
								_handler: (opts: {
									data: { productId: string; variantId: string; quantity: number; };
									context: typeof testContext;
								}) => Promise<unknown>;
							})
								._handler;

						await expect(
							handler(
								{
									data: {
										productId: "prod-uuid-001",
										variantId: "var-uuid-001",
										quantity: 1
									},
									context: testContext
								}))
							.rejects
							.toThrow("Out of stock");
					});
			});

		describe("removeFromCart",
			() =>
			{
				it("removeFromCart_CallsRemoveCartItem",
					async () =>
					{
						mockRemoveCartItem.mockResolvedValue(undefined);

						const { removeFromCart } =
							await import("../../../server/functions/cart");

						const handler: (opts: {
							data: { cartItemId: string; };
							context: typeof testContext;
						}) => Promise<unknown> =
							(removeFromCart as unknown as {
								_handler: (opts: {
									data: { cartItemId: string; };
									context: typeof testContext;
								}) => Promise<unknown>;
							})
								._handler;

						await handler(
							{
								data: { cartItemId: "item-uuid-001" },
								context: testContext
							});

						expect(mockRemoveCartItem)
							.toHaveBeenCalledWith(
								{},
								"test-session-uuid",
								"item-uuid-001");
					});
			});

		describe("updateCartItem",
			() =>
			{
				it("updateCartItem_CallsUpdateCartItemQuantity",
					async () =>
					{
						mockUpdateCartItemQuantity.mockResolvedValue(undefined);

						const { updateCartItem } =
							await import("../../../server/functions/cart");

						const handler: (opts: {
							data: { cartItemId: string; quantity: number; };
							context: typeof testContext;
						}) => Promise<unknown> =
							(updateCartItem as unknown as {
								_handler: (opts: {
									data: { cartItemId: string; quantity: number; };
									context: typeof testContext;
								}) => Promise<unknown>;
							})
								._handler;

						await handler(
							{
								data: {
									cartItemId: "item-uuid-001",
									quantity: 3
								},
								context: testContext
							});

						expect(mockUpdateCartItemQuantity)
							.toHaveBeenCalledWith(
								{},
								"test-session-uuid",
								"item-uuid-001",
								3);
					});
			});
	});