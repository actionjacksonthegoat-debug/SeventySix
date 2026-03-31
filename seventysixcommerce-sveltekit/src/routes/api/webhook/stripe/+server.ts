import { env } from "$env/dynamic/private";
import { db } from "$lib/server/db";
import {
	cartItems,
	checkoutSnapshots,
	orderItems,
	orders,
	orderStatusHistory,
	productVariants
} from "$lib/server/db/schema";
import { sendOrderConfirmation } from "$lib/server/integrations/brevo";
import { createPrintfulOrder } from "$lib/server/integrations/printful";
import { getStripe } from "$lib/server/stripe";
import { now } from "$lib/utils/date";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import type { RequestHandler } from "./$types";

/**
 * Stripe webhook handler.
 * CSRF not required — Stripe uses signature verification.
 */
export const POST: RequestHandler =
	async ({ request }) =>
	{
		const payload: string =
			await request.text();
		const signature: string =
			request.headers.get("stripe-signature") ?? "";

		const stripe =
			getStripe();
		let event: Stripe.Event;
		try
		{
			event =
				stripe.webhooks.constructEvent(
					payload,
					signature,
					env.STRIPE_WEBHOOK_SECRET ?? "") as Stripe.Event;
		}
		catch
		{
			return new Response("Invalid signature",
				{ status: 400 });
		}

		if (event.type === "checkout.session.completed")
		{
			const session =
				event.data.object as Stripe.Checkout.Session;
			await handleCheckoutCompleted(session);
		}

		return new Response(
			JSON.stringify(
				{ received: true }),
			{
				status: 200,
				headers: { "Content-Type": "application/json" }
			});
	};

/** Creates order record, copies cart items, clears cart. Idempotent. */
async function handleCheckoutCompleted(
	session: Stripe.Checkout.Session): Promise<void>
{
	const cartSessionId: string =
		session.metadata?.cartSessionId ?? "";

	// Idempotency: skip if order already exists
	const existing =
		await db
			.select(
				{ id: orders.id })
			.from(orders)
			.where(eq(orders.stripeSessionId, session.id))
			.limit(1);

	if (existing.length > 0)
	{
		return;
	}

	// Read the immutable snapshot captured at checkout creation — prevents post-checkout cart tampering
	const snapshotRow =
		await db
			.select(
				{ items: checkoutSnapshots.items })
			.from(checkoutSnapshots)
			.where(eq(checkoutSnapshots.stripeSessionId, session.id))
			.limit(1);
	const snapshotItems =
		snapshotRow[0]?.items ?? null;

	await db.transaction(
		async (tx) =>
		{
			const [order] =
				await tx
					.insert(orders)
					.values(
						{
							stripeSessionId: session.id,
							cartSessionId,
							email: session.customer_details?.email ?? "",
							status: "paid",
							totalAmount: String((session.amount_total ?? 0) / 100),
							shippingAddress: session.collected_information?.shipping_details?.address
								?? null,
							shippingName: session.collected_information?.shipping_details?.name
								?? null
						})
					.returning();

			// Use snapshot if present; fall back to live cart for legacy or replayed events
			const itemsToFulfill =
				snapshotItems ?? await tx
					.select(
						{
							productId: cartItems.productId,
							variantId: cartItems.variantId,
							quantity: cartItems.quantity,
							unitPrice: cartItems.unitPrice
						})
					.from(cartItems)
					.where(eq(cartItems.sessionId, cartSessionId));

			if (itemsToFulfill.length > 0)
			{
				await tx
					.insert(orderItems)
					.values(
						itemsToFulfill.map((item) => ({
							orderId: order.id,
							productId: item.productId,
							variantId: item.variantId,
							quantity: item.quantity,
							unitPrice: String(item.unitPrice)
						})));
			}

			await tx
				.delete(cartItems)
				.where(eq(cartItems.sessionId, cartSessionId));

			// Record status transition
			await tx
				.insert(orderStatusHistory)
				.values(
					{
						orderId: order.id,
						fromStatus: null,
						toStatus: "paid",
						reason: "Stripe checkout completed"
					});
		});

	// Post-transaction: fulfillment + email (non-blocking — errors logged, not thrown)
	const [createdOrder] =
		await db
			.select()
			.from(orders)
			.where(eq(orders.stripeSessionId, session.id))
			.limit(1);

	if (createdOrder === undefined)
	{
		return;
	}

	// Printful fulfillment (separate try/catch from email)
	try
	{
		const items =
			await db
				.select(
					{
						quantity: orderItems.quantity,
						printfulSyncVariantId: productVariants.printfulSyncVariantId
					})
				.from(orderItems)
				.innerJoin(
					productVariants,
					eq(orderItems.variantId, productVariants.id))
				.where(eq(orderItems.orderId, createdOrder.id));

		const address =
			(createdOrder.shippingAddress ?? {}) as Record<
				string,
				string>;

		const printfulResult =
			await createPrintfulOrder(
				{
					shippingName: createdOrder.shippingName ?? "",
					shippingAddress: address,
					items
				});

		await db
			.update(orders)
			.set(
				{
					printfulOrderId: String(printfulResult.id),
					status: "fulfilling",
					updatedAt: now()
				})
			.where(eq(orders.id, createdOrder.id));

		await db
			.insert(orderStatusHistory)
			.values(
				{
					orderId: createdOrder.id,
					fromStatus: "paid",
					toStatus: "fulfilling",
					reason: `Printful order ${printfulResult.id} created`
				});
	}
	catch (error: unknown)
	{
		console.error(
			"[Printful] Fulfillment error:",
			error instanceof Error ? error.message : "Unknown");
		await db
			.update(orders)
			.set(
				{ status: "fulfillment_error", updatedAt: now() })
			.where(eq(orders.id, createdOrder.id));

		await db
			.insert(orderStatusHistory)
			.values(
				{
					orderId: createdOrder.id,
					fromStatus: "paid",
					toStatus: "fulfillment_error",
					reason: "Printful fulfillment failed"
				});
	}

	// Email notification (separate try/catch — never blocks)
	try
	{
		const items =
			await db
				.select(
					{ quantity: orderItems.quantity })
				.from(orderItems)
				.where(eq(orderItems.orderId, createdOrder.id));

		const itemCount: number =
			items.reduce((sum, item) => sum + item.quantity, 0);
		await sendOrderConfirmation(
			createdOrder.email,
			createdOrder.id,
			createdOrder.totalAmount,
			itemCount);
	}
	catch (emailError: unknown)
	{
		console.error(
			"[Brevo] Email error:",
			emailError instanceof Error ? emailError.message : "Unknown");
	}
}