import {
	buildShippingOptions,
	buildStripeLineItems,
	calculateSubtotal,
	createCheckoutSnapshot,
	createMockOrder,
	type ValidatedCartRow
} from "@seventysixcommerce/shared/checkout";
import { now } from "@seventysixcommerce/shared/date";
import { cartEmptyError, checkoutFailedError, itemsUnavailableError } from "@seventysixcommerce/shared/errors";
import { getStripe, type StripeClient } from "@seventysixcommerce/shared/stripe";
import { isNullOrUndefined } from "@seventysixcommerce/shared/utils";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "../db";
import * as schema from "../db/schema";
import { queueLog } from "../log-forwarder";
import { recordCheckoutComplete, recordCheckoutStart } from "../metrics";
import { cartSessionMiddleware } from "../middleware/cart-session";
import { csrfMiddleware } from "../middleware/csrf";

/** Checkout session response. */
interface CheckoutSessionResponse
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
					throw cartEmptyError();
				}

				// Validate all products are still active and available
				const unavailable: CartProductRow[] =
					cartRows.filter(
						(row) =>
							!row.isActive || !row.isAvailable);
				if (unavailable.length > 0)
				{
					throw itemsUnavailableError(
						unavailable.map((row) => row.productTitle));
				}

				const validatedRows: ValidatedCartRow[] =
					cartRows.map(
						(row) => ({
							productId: row.productId,
							variantId: row.variantId,
							quantity: row.quantity,
							productTitle: row.productTitle,
							variantName: row.variantName,
							imageUrl: row.thumbnailUrl,
							currentPrice: row.currentPrice
						}));

				const lineItems =
					buildStripeLineItems(validatedRows);
				const subtotal: number =
					calculateSubtotal(validatedRows);
				const shippingOptions =
					buildShippingOptions(subtotal);

				const baseUrl: string =
					process.env.BASE_URL ?? "https://localhost:3002";

				const stripe: StripeClient =
					getStripe(
						{
							secretKey: process.env.STRIPE_SECRET_KEY,
							useMocks: process.env.MOCK_SERVICES !== "false",
							baseUrl
						});

				const session =
					await stripe.checkout.sessions.create(
						{
							mode: "payment",
							line_items: lineItems,
							shipping_options: shippingOptions,
							shipping_address_collection: { allowed_countries: ["US"] },
							success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
							cancel_url: `${baseUrl}/cart`,
							metadata: { cartSessionId: context.cartSessionId }
						});

				await createCheckoutSnapshot(
					db,
					session.id,
					context.cartSessionId,
					validatedRows);

				// In mock mode, simulate webhook — create the order immediately since no real Stripe webhook fires
				if (process.env.MOCK_SERVICES !== "false")
				{
					const amountTotal: number | null =
						"amount_total" in session
							? (session.amount_total as number | null)
							: null;

					await createMockOrder(
						db,
						session.id,
						amountTotal,
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

				if (isNullOrUndefined(session.url))
				{
					throw checkoutFailedError();
				}

				return { url: session.url };
			});