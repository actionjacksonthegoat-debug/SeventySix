import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { sendOrderConfirmation } from "../../lib/brevo";
import { now } from "../../lib/date";
import { createPrintfulOrder, type PrintfulOrderResult } from "../../lib/printful";
import { db } from "../db";
import * as schema from "../db/schema";
import { getStripe } from "../lib/stripe";

/**
 * Processes a Stripe webhook event. Verifies signature, then routes to handler.
 * CSRF is NOT required — Stripe uses its own signature verification.
 */
export async function handleStripeWebhook(
	rawBody: string,
	signature: string): Promise<{ received: boolean; }>
{
	let event: Stripe.Event;

	try
	{
		event =
			getStripe().webhooks.constructEvent(
				rawBody,
				signature,
				process.env.STRIPE_WEBHOOK_SECRET ?? "");
	}
	catch
	{
		throw new Error("Invalid webhook signature");
	}

	switch (event.type)
	{
		case "checkout.session.completed":
		{
			const session: Stripe.Checkout.Session =
				event.data.object as Stripe.Checkout.Session;
			await handleCheckoutCompleted(session);
			break;
		}
			// Additional event types can be added here
	}

	return { received: true };
}

/**
 * Processes a completed checkout session:
 * 1. Idempotency check — skip if order already exists for this Stripe session
 * 2. Creates an Order record
 * 3. Copies cart items to order_items
 * 4. Clears the cart session
 */
async function handleCheckoutCompleted(
	session: Stripe.Checkout.Session): Promise<void>
{
	const cartSessionId: string =
		session.metadata?.cartSessionId ?? "";

	// Idempotency: skip if order already exists for this Stripe session
	const existing: { id: string; }[] =
		await db
			.select(
				{ id: schema.orders.id })
			.from(schema.orders)
			.where(eq(schema.orders.stripeSessionId, session.id))
			.limit(1);

	if (existing.length > 0)
	{
		return;
	}

	// Read the immutable snapshot captured at checkout creation — prevents post-checkout cart tampering
	const snapshotRow: {
		items: Array<{ productId: string; variantId: string; quantity: number; unitPrice: string; }>;
	}[] =
		await db
			.select(
				{ items: schema.checkoutSnapshots.items })
			.from(schema.checkoutSnapshots)
			.where(eq(schema.checkoutSnapshots.stripeSessionId, session.id))
			.limit(1);
	const snapshotItems: Array<{ productId: string; variantId: string; quantity: number; unitPrice: string; }> | null =
		snapshotRow[0]?.items ?? null;

	await db.transaction(
		async (tx) =>
		{
			// Create order record
			const [order] =
				await tx
					.insert(schema.orders)
					.values(
						{
							stripeSessionId: session.id,
							cartSessionId: cartSessionId ?? null,
							email: session.customer_details?.email ?? "",
							status: "paid",
							totalAmount: String(
								((session.amount_total ?? 0) / 100).toFixed(2)),
							shippingAddress: session.collected_information?.shipping_details?.address
								?? null,
							shippingName: session.collected_information?.shipping_details?.name
								?? null
						})
					.returning();

			if (order === null || order === undefined)
			{
				throw new Error("Failed to create order");
			}

			// Copy cart items to order items
			if (cartSessionId !== "")
			{
				// Use snapshot if present; fall back to live cart for legacy or replayed events
				const itemsToFulfill: { productId: string; variantId: string; quantity: number; unitPrice: string; }[] =
					snapshotItems ?? await tx
						.select(
							{
								productId: schema.cartItems.productId,
								variantId: schema.cartItems.variantId,
								quantity: schema.cartItems.quantity,
								unitPrice: schema.cartItems.unitPrice
							})
						.from(schema.cartItems)
						.where(eq(schema.cartItems.sessionId, cartSessionId));

				if (itemsToFulfill.length > 0)
				{
					await tx
						.insert(schema.orderItems)
						.values(
							itemsToFulfill.map((item) => ({
								orderId: order.id,
								productId: item.productId,
								variantId: item.variantId,
								quantity: item.quantity,
								unitPrice: String(item.unitPrice)
							})));
				}

				// Clear the cart
				await tx
					.delete(schema.cartItems)
					.where(eq(schema.cartItems.sessionId, cartSessionId));
			}

			// Record status history
			await tx
				.insert(schema.orderStatusHistory)
				.values(
					{
						orderId: order.id,
						fromStatus: null,
						toStatus: "paid",
						reason: "Stripe checkout completed"
					});
		});

	// Post-transaction: Printful fulfillment (non-blocking for order creation)
	const printfulApiKey: string =
		process.env.PRINTFUL_API_KEY ?? "";
	if (printfulApiKey !== "" && cartSessionId !== "")
	{
		try
		{
			// Fetch order items with Printful variant IDs
			const latestOrder: { id: string; }[] =
				await db
					.select(
						{ id: schema.orders.id })
					.from(schema.orders)
					.where(eq(schema.orders.stripeSessionId, session.id))
					.limit(1);

			if (latestOrder[0] !== undefined)
			{
				const items: { printfulSyncVariantId: string | null; quantity: number; }[] =
					await db
						.select(
							{
								printfulSyncVariantId: schema.productVariants.printfulSyncVariantId,
								quantity: schema.orderItems.quantity
							})
						.from(schema.orderItems)
						.innerJoin(
							schema.productVariants,
							eq(
								schema.orderItems.variantId,
								schema.productVariants.id))
						.where(eq(schema.orderItems.orderId, latestOrder[0].id));

				const address: Record<string, string> =
					(session
						.collected_information
						?.shipping_details
						?.address ?? {}) as Record<string, string>;
				const shippingName: string =
					session.collected_information?.shipping_details?.name ?? "";

				const printfulResult: PrintfulOrderResult =
					await createPrintfulOrder(
						{
							shippingName,
							shippingAddress: {
								line1: address.line1,
								city: address.city,
								state: address.state,
								postal_code: address.postal_code,
								country: address.country
							},
							items
						},
						printfulApiKey);

				// Update order with Printful ID and status
				await db
					.update(schema.orders)
					.set(
						{
							printfulOrderId: String(printfulResult.id),
							status: "fulfilling",
							updatedAt: now()
						})
					.where(eq(schema.orders.id, latestOrder[0].id));

				await db
					.insert(schema.orderStatusHistory)
					.values(
						{
							orderId: latestOrder[0].id,
							fromStatus: "paid",
							toStatus: "fulfilling",
							reason: `Printful order ${printfulResult.id} created`
						});
			}
		}
		catch (error: unknown)
		{
			console.error(
				"[Printful] Fulfillment error:",
				error instanceof Error ? error.message : "Unknown");
			// Mark order with fulfillment error but don't throw — payment already succeeded
			const failedOrder: { id: string; }[] =
				await db
					.select(
						{ id: schema.orders.id })
					.from(schema.orders)
					.where(eq(schema.orders.stripeSessionId, session.id))
					.limit(1);

			if (failedOrder[0] !== undefined)
			{
				await db
					.update(schema.orders)
					.set(
						{ status: "fulfillment_error", updatedAt: now() })
					.where(eq(schema.orders.id, failedOrder[0].id));
			}
		}
	}

	// Send order confirmation email (never block on email failure)
	const customerEmail: string =
		session.customer_details?.email ?? "";
	if (customerEmail)
	{
		const orderForEmail =
			await db
				.select(
					{
						id: schema.orders.id,
						totalAmount: schema.orders.totalAmount
					})
				.from(schema.orders)
				.where(eq(schema.orders.stripeSessionId, session.id))
				.limit(1);

		if (orderForEmail[0])
		{
			const itemCount =
				await db
					.select(
						{ quantity: schema.orderItems.quantity })
					.from(schema.orderItems)
					.where(eq(schema.orderItems.orderId, orderForEmail[0].id));

			const totalItems: number =
				itemCount.reduce(
					(sum, row) => sum + row.quantity,
					0);

			await sendOrderConfirmation(
				customerEmail,
				orderForEmail[0].id,
				String(orderForEmail[0].totalAmount),
				totalItems);
		}
	}
}