import { env } from "$env/dynamic/private";
import { db } from "$lib/server/db";
import { type CartItemWithProduct, getCart } from "$lib/server/db/cart";
import {
	products
} from "$lib/server/db/schema";
import { queueLog } from "$lib/server/log-forwarder";
import { recordCheckoutComplete, recordCheckoutStart } from "$lib/server/metrics";
import { getStripe } from "$lib/server/stripe";
import {
	buildShippingOptions,
	buildStripeLineItems,
	calculateSubtotal,
	createCheckoutSnapshot,
	createMockOrder,
	type ValidatedCartRow
} from "@seventysixcommerce/shared/checkout";
import { now } from "@seventysixcommerce/shared/date";
import { fail, redirect } from "@sveltejs/kit";
import { and, eq, inArray } from "drizzle-orm";
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
			const productIds: string[] =
				[...new Set(cart.map((item) => item.productId))];

			const activeProducts: { id: string; basePrice: string; }[] =
				await db
					.select(
						{
							id: products.id,
							basePrice: products.basePrice
						})
					.from(products)
					.where(
						and(
							inArray(products.id, productIds),
							eq(products.isActive, true)));

			const priceMap: Map<string, string> =
				new Map(
					activeProducts.map(
						(product) =>
							[product.id, product.basePrice]));

			const validItems: (CartItemWithProduct & { currentPrice: string; })[] =
				cart
					.filter((item) => priceMap.has(item.productId))
					.map((item) => ({
						...item,
						currentPrice: priceMap.get(item.productId)!
					}));

			if (validItems.length === 0)
			{
				return fail(400,
					{ error: "No active products in cart" });
			}

			const validatedRows: ValidatedCartRow[] =
				validItems.map(
					(item) => ({
						productId: item.productId,
						variantId: item.variantId,
						quantity: item.quantity,
						productTitle: item.productTitle,
						variantName: item.variantName,
						imageUrl: item.imageUrl,
						currentPrice: item.currentPrice
					}));

			const lineItems =
				buildStripeLineItems(validatedRows);
			const subtotal: number =
				calculateSubtotal(validatedRows);
			const shippingOptions =
				buildShippingOptions(subtotal);

			const stripe: ReturnType<typeof getStripe> =
				getStripe();
			const session: Awaited<ReturnType<typeof stripe.checkout.sessions.create>> =
				await stripe
					.checkout
					.sessions
					.create(
						{
							mode: "payment",
							line_items: lineItems,
							shipping_options: shippingOptions,
							shipping_address_collection: { allowed_countries: ["US"] },
							success_url: `${env.BASE_URL ?? ""}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
							cancel_url: `${env.BASE_URL ?? ""}/cart`,
							metadata: { cartSessionId: locals.cartSessionId }
						});

			await createCheckoutSnapshot(
				db,
				session.id,
				locals.cartSessionId,
				validatedRows);

			// In mock mode, simulate webhook — create the order immediately since no real Stripe webhook fires
			if (env.MOCK_SERVICES !== "false")
			{
				const amountTotal: number | null =
					"amount_total" in session
						? (session.amount_total as number | null)
						: null;
				await createMockOrder(
					db,
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