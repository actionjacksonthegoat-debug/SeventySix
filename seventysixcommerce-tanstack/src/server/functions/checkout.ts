import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { FREE_SHIPPING_THRESHOLD, MOCK_ORDER_EMAIL, STANDARD_SHIPPING_CENTS } from "~/lib/constants";
import { now } from "~/lib/date";
import { db } from "../db";
import * as schema from "../db/schema";
import { getStripe } from "../lib/stripe";
import { queueLog } from "../log-forwarder";
import { recordCheckoutComplete, recordCheckoutStart } from "../metrics";
import { cartSessionMiddleware } from "../middleware/cart-session";
import { csrfMiddleware } from "../middleware/csrf";

/** Checkout session response. */
export interface CheckoutSessionResponse
{
	url: string;
}

/** Shape returned from the cart + product join query during checkout. */
interface CartProductRow
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

/**
 * Creates a Stripe Checkout session from the current cart.
 * Re-validates all prices server-side to prevent price manipulation.
 */
export const createCheckoutSession =
	createServerFn(
		{ method: "POST" })
		.middleware(
			[cartSessionMiddleware, csrfMiddleware])
		.handler(
			async ({ context }): Promise<CheckoutSessionResponse> =>
			{
				const checkoutStartTime: number =
					now()
						.getTime();
				recordCheckoutStart();
				queueLog(
					{
						logLevel: "Information",
						message: "Checkout started"
					});

				const cartRows: CartProductRow[] =
					await db
						.select(
							{
								productId: schema.cartItems.productId,
								variantId: schema.cartItems.variantId,
								quantity: schema.cartItems.quantity,
								productTitle: schema.products.title,
								variantName: schema.productVariants.name,
								thumbnailUrl: schema.products.thumbnailUrl,
								currentPrice: schema.products.basePrice,
								isActive: schema.products.isActive,
								isAvailable: schema.productVariants.isAvailable
							})
						.from(schema.cartItems)
						.innerJoin(
							schema.products,
							eq(schema.cartItems.productId, schema.products.id))
						.innerJoin(
							schema.productVariants,
							eq(schema.cartItems.variantId, schema.productVariants.id))
						.where(eq(schema.cartItems.sessionId, context.cartSessionId));

				if (cartRows.length === 0)
				{
					throw new Error("Cart is empty");
				}

				// Validate all products are still active and available
				const unavailable: CartProductRow[] =
					cartRows.filter(
						(row) =>
							!row.isActive || !row.isAvailable);
				if (unavailable.length > 0)
				{
					const names: string =
						unavailable
							.map((row) => row.productTitle)
							.join(", ");
					throw new Error(
						`The following items are no longer available: ${names}`);
				}

				const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
					cartRows.map((row) => ({
						price_data: {
							currency: "usd",
							product_data: {
								name: row.productTitle,
								description: row.variantName,
								images: [row.thumbnailUrl]
							},
							unit_amount: Math.round(
								parseFloat(String(row.currentPrice)) * 100)
						},
						quantity: row.quantity
					}));

				const subtotal: number =
					cartRows.reduce(
						(sum, row) =>
							sum + parseFloat(String(row.currentPrice)) * row.quantity,
						0);

				const shippingOptions: Stripe.Checkout.SessionCreateParams.ShippingOption[] =
					[
						{
							shipping_rate_data: {
								type: "fixed_amount",
								fixed_amount: {
									amount: subtotal >= FREE_SHIPPING_THRESHOLD
										? 0
										: STANDARD_SHIPPING_CENTS,
									currency: "usd"
								},
								display_name: subtotal >= FREE_SHIPPING_THRESHOLD
									? "Free Shipping"
									: "Standard Shipping"
							}
						}
					];

				const baseUrl: string =
					process.env.BASE_URL ?? "https://localhost:3002";

				const session: Awaited<
					ReturnType<
					typeof getStripe extends () => infer S
						? S extends { checkout: { sessions: { create: (...args: never[]) => infer R; }; }; } ? () => R
							: never
						: never>> =
					await getStripe().checkout.sessions.create(
						{
							mode: "payment",
							line_items: lineItems,
							shipping_options: shippingOptions,
							shipping_address_collection: { allowed_countries: ["US"] },
							success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
							cancel_url: `${baseUrl}/cart`,
							metadata: { cartSessionId: context.cartSessionId }
						});

				// In mock mode, simulate webhook — create the order immediately since no real Stripe webhook fires
				// Save immutable snapshot of validated cart items for tamper-proof fulfillment
				await db
					.insert(schema.checkoutSnapshots)
					.values(
						{
							stripeSessionId: session.id,
							cartSessionId: context.cartSessionId,
							items: cartRows.map((row) => ({
								productId: row.productId,
								variantId: row.variantId,
								quantity: row.quantity,
								unitPrice: String(row.currentPrice)
							}))
						});

				// In mock mode, simulate webhook — create the order immediately since no real Stripe webhook fires
				if (process.env.MOCK_SERVICES !== "false")
				{
					await createMockOrder(
						session as unknown as Stripe.Checkout.Session,
						context.cartSessionId);

					recordCheckoutComplete(
						now()
							.getTime() - checkoutStartTime);
					queueLog(
						{
							logLevel: "Information",
							message: `Checkout complete: session ${session.id}`
						});
				}

				if (session.url === null || session.url === undefined)
				{
					throw new Error("Failed to create checkout session");
				}

				return { url: session.url };
			});

/**
 * Creates an order directly in mock mode (no real Stripe webhook fires).
 * Mirrors the core transaction from webhook's handleCheckoutCompleted.
 */
async function createMockOrder(
	session: Stripe.Checkout.Session,
	cartSessionId: string): Promise<void>
{
	await db.transaction(
		async (tx) =>
		{
			const [order] =
				await tx
					.insert(schema.orders)
					.values(
						{
							stripeSessionId: session.id,
							cartSessionId,
							email: MOCK_ORDER_EMAIL,
							status: "paid",
							totalAmount: String(
								((session.amount_total ?? 0) / 100).toFixed(2)),
							shippingAddress: null,
							shippingName: "Mock Customer"
						})
					.returning();

			if (order === null || order === undefined)
			{
				throw new Error("Failed to create mock order");
			}

			const cartItems: { productId: string; variantId: string; quantity: number; unitPrice: string; }[] =
				await tx
					.select(
						{
							productId: schema.cartItems.productId,
							variantId: schema.cartItems.variantId,
							quantity: schema.cartItems.quantity,
							unitPrice: schema.cartItems.unitPrice
						})
					.from(schema.cartItems)
					.where(eq(schema.cartItems.sessionId, cartSessionId));

			if (cartItems.length > 0)
			{
				await tx
					.insert(schema.orderItems)
					.values(
						cartItems.map((item) => ({
							orderId: order.id,
							productId: item.productId,
							variantId: item.variantId,
							quantity: item.quantity,
							unitPrice: String(item.unitPrice)
						})));
			}

			await tx
				.delete(schema.cartItems)
				.where(eq(schema.cartItems.sessionId, cartSessionId));

			await tx
				.insert(schema.orderStatusHistory)
				.values(
					{
						orderId: order.id,
						fromStatus: null,
						toStatus: "paid",
						reason: "Mock checkout completed"
					});
		});
}