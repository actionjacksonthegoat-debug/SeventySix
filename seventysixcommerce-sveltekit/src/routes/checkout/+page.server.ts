import { env } from "$env/dynamic/private";
import {
	CENTS_PER_DOLLAR,
	FREE_SHIPPING_THRESHOLD,
	MOCK_ORDER_EMAIL,
	STANDARD_SHIPPING_CENTS
} from "$lib/constants";
import { db } from "$lib/server/db";
import { type CartItemWithProduct, getCart } from "$lib/server/db/cart";
import {
	cartItems,
	checkoutSnapshots,
	orderItems,
	orders,
	orderStatusHistory,
	products
} from "$lib/server/db/schema";
import { queueLog } from "$lib/server/log-forwarder";
import { recordCheckoutComplete, recordCheckoutStart } from "$lib/server/metrics";
import { getStripe } from "$lib/server/stripe";
import { now } from "$lib/utils/date";
import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { Actions } from "./$types";

/** Checkout actions — creates Stripe session and redirects. */
export const actions: Actions =
	{
	/** Creates Stripe Checkout session and redirects to Stripe hosted page. */
		default: async ({ locals }) =>
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

			const cart: CartItemWithProduct[] =
				await getCart(locals.cartSessionId);

			if (cart.length === 0)
			{
				return fail(400,
					{ error: "Cart is empty" });
			}

			// Re-validate prices from database — never trust stale cart data
			const cartWithCurrentPrices: ((CartItemWithProduct & { currentPrice: string; }) | null)[] =
				await Promise.all(
					cart.map(
						async (item) =>
						{
							const [product] =
								await db
									.select(
										{
											basePrice: products.basePrice,
											isActive: products.isActive
										})
									.from(products)
									.where(eq(products.id, item.productId))
									.limit(1);

							if (product === null || product === undefined || !product.isActive)
							{
								return null;
							}

							return { ...item, currentPrice: product.basePrice };
						}));

			const validItems: (CartItemWithProduct & { currentPrice: string; })[] =
				cartWithCurrentPrices.filter(
					(item): item is NonNullable<typeof item> =>
						item !== null);

			if (validItems.length === 0)
			{
				return fail(400,
					{ error: "No active products in cart" });
			}

			const subtotal: number =
				validItems.reduce(
					(sum, item) =>
						sum + Number(item.currentPrice) * item.quantity,
					0);

			const stripe: ReturnType<typeof getStripe> =
				getStripe();
			const session: Awaited<ReturnType<typeof stripe.checkout.sessions.create>> =
				await stripe
					.checkout
					.sessions
					.create(
						{
							mode: "payment",
							line_items: validItems.map((item) => ({
								price_data: {
									currency: "usd",
									product_data: {
										name: item.productTitle,
										description: item.variantName,
										images: [item.imageUrl]
									},
									unit_amount: Math.round(Number(item.currentPrice) * CENTS_PER_DOLLAR)
								},
								quantity: item.quantity
							})),
							shipping_options: subtotal >= FREE_SHIPPING_THRESHOLD
								? [
									{
										shipping_rate_data: {
											type: "fixed_amount" as const,
											fixed_amount: {
												amount: 0,
												currency: "usd"
											},
											display_name: "Free Shipping"
										}
									}
								]
								: [
									{
										shipping_rate_data: {
											type: "fixed_amount" as const,
											fixed_amount: {
												amount: STANDARD_SHIPPING_CENTS,
												currency: "usd"
											},
											display_name: "Standard Shipping"
										}
									}
								],
							shipping_address_collection: { allowed_countries: ["US"] },
							success_url: `${env.BASE_URL ?? ""}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
							cancel_url: `${env.BASE_URL ?? ""}/cart`,
							metadata: { cartSessionId: locals.cartSessionId }
						});

			// In mock mode, simulate webhook — create the order immediately since no real Stripe webhook fires
			// Save immutable snapshot of validated cart items for tamper-proof fulfillment
			await db
				.insert(checkoutSnapshots)
				.values(
					{
						stripeSessionId: session.id,
						cartSessionId: locals.cartSessionId,
						items: validItems.map((item) => ({
							productId: item.productId,
							variantId: item.variantId,
							quantity: item.quantity,
							unitPrice: String(item.currentPrice)
						}))
					});

			// In mock mode, simulate webhook — create the order immediately since no real Stripe webhook fires
			if (env.MOCK_SERVICES !== "false")
			{
				const amountTotal: number | null =
					"amount_total" in session
						? (session.amount_total as number | null)
						: null;
				await createMockOrder(
					session.id,
					amountTotal,
					locals.cartSessionId);

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
				return fail(500,
					{ error: "Checkout session creation failed" });
			}

			redirect(303, session.url);
		}
	};

/**
 * Creates an order directly in mock mode (no real Stripe webhook fires).
 * Mirrors the core transaction from the webhook's handleCheckoutCompleted.
 */
async function createMockOrder(
	sessionId: string,
	amountTotal: number | null,
	cartSessionId: string): Promise<void>
{
	await db.transaction(
		async (tx) =>
		{
			const [order] =
				await tx
					.insert(orders)
					.values(
						{
							stripeSessionId: sessionId,
							cartSessionId,
							email: MOCK_ORDER_EMAIL,
							status: "paid",
							totalAmount: String(((amountTotal ?? 0) / 100).toFixed(2)),
							shippingAddress: null,
							shippingName: "Mock Customer"
						})
					.returning();

			if (order === null || order === undefined)
			{
				throw new Error("Failed to create mock order");
			}

			const items: { productId: string; variantId: string; quantity: number; unitPrice: string; }[] =
				await tx
					.select(
						{
							productId: cartItems.productId,
							variantId: cartItems.variantId,
							quantity: cartItems.quantity,
							unitPrice: cartItems.unitPrice
						})
					.from(cartItems)
					.where(eq(cartItems.sessionId, cartSessionId));

			if (items.length > 0)
			{
				await tx
					.insert(orderItems)
					.values(
						items.map((item) => ({
							orderId: order.id,
							productId: item.productId,
							variantId: item.variantId,
							quantity: item.quantity,
							unitPrice: item.unitPrice
						})));
			}

			await tx
				.delete(cartItems)
				.where(eq(cartItems.sessionId, cartSessionId));

			await tx
				.insert(orderStatusHistory)
				.values(
					{
						orderId: order.id,
						fromStatus: null,
						toStatus: "paid",
						reason: "Mock checkout completed"
					});
		});
}