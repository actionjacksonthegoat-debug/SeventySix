/**
 * Framework-agnostic webhook processing.
 * Both SvelteKit and TanStack apps delegate core webhook logic here,
 * keeping only signature verification and framework-specific wrappers.
 */
import { eq } from "drizzle-orm";
import type { CommerceDb } from "../cart";
import {
	cartItems,
	checkoutSnapshots,
	orderItems,
	orders,
	orderStatusHistory,
	productVariants
} from "../schema";
import type { OrderForFulfillment, PrintfulOrderResult, ShippingAddress } from "../types";

/** Fulfillment client callback — matches the shared PrintfulClient interface. */
export type FulfillmentClient = (
	order: OrderForFulfillment) => Promise<PrintfulOrderResult>;

/** Email notification callback. */
export type EmailClient = (
	email: string,
	orderId: string,
	totalAmount: string,
	itemCount: number) => Promise<void>;

/** Checkout session data needed for order creation. */
export interface CheckoutSessionData
{
	/** Stripe session ID. */
	stripeSessionId: string;
	/** Cart session ID from metadata. */
	cartSessionId: string;
	/** Customer email. */
	customerEmail: string;
	/** Total amount in cents. */
	amountTotalCents: number | null;
	/** Shipping address (nullable). */
	shippingAddress: Record<string, string> | null;
	/** Shipping recipient name (nullable). */
	shippingName: string | null;
}

/**
 * Checks whether an order already exists for the given Stripe session.
 * Used for idempotency — skip processing if order was already created.
 */
export async function isOrderProcessed(
	db: CommerceDb,
	stripeSessionId: string): Promise<boolean>
{
	const existing: { id: string; }[] =
		await db
			.select(
				{ id: orders.id })
			.from(orders)
			.where(eq(orders.stripeSessionId, stripeSessionId))
			.limit(1);

	return existing.length > 0;
}

/**
 * Processes a completed checkout session:
 * 1. Reads immutable checkout snapshot
 * 2. Creates order in transaction (order record, order items, clears cart, status history)
 * 3. Post-transaction: Printful fulfillment (non-blocking)
 * 4. Post-transaction: Email confirmation (non-blocking)
 *
 * Caller must perform idempotency check via isOrderProcessed() before calling.
 */
export async function handleCheckoutCompleted(
	db: CommerceDb,
	session: CheckoutSessionData,
	fulfillmentClient: FulfillmentClient | null,
	emailClient: EmailClient | null,
	getNow: () => Date): Promise<void>
{
	// Read immutable snapshot captured at checkout creation
	const snapshotRow: {
		items: Array<{ productId: string; variantId: string; quantity: number; unitPrice: string; }>;
	}[] =
		await db
			.select(
				{ items: checkoutSnapshots.items })
			.from(checkoutSnapshots)
			.where(eq(checkoutSnapshots.stripeSessionId, session.stripeSessionId))
			.limit(1);
	const snapshotItems: Array<{ productId: string; variantId: string; quantity: number; unitPrice: string; }> | null =
		snapshotRow[0]?.items ?? null;

	await db.transaction(
		async (tx) =>
		{
			const [order] =
				await tx
					.insert(orders)
					.values(
						{
							stripeSessionId: session.stripeSessionId,
							cartSessionId: session.cartSessionId ?? null,
							email: session.customerEmail,
							status: "paid",
							totalAmount: String(
								((session.amountTotalCents ?? 0) / 100).toFixed(2)),
							shippingAddress: session.shippingAddress ?? null,
							shippingName: session.shippingName ?? null
						})
					.returning();

			if (order === null || order === undefined)
			{
				throw new Error("Failed to create order");
			}

			// Use snapshot if present; fall back to live cart for legacy or replayed events
			if (session.cartSessionId !== "")
			{
				const itemsToFulfill: { productId: string; variantId: string; quantity: number; unitPrice: string; }[] =
					snapshotItems ?? await tx
						.select(
							{
								productId: cartItems.productId,
								variantId: cartItems.variantId,
								quantity: cartItems.quantity,
								unitPrice: cartItems.unitPrice
							})
						.from(cartItems)
						.where(eq(cartItems.sessionId, session.cartSessionId));

				if (itemsToFulfill.length > 0)
				{
					await tx
						.insert(orderItems)
						.values(
							itemsToFulfill.map(
								(item) => ({
									orderId: order.id,
									productId: item.productId,
									variantId: item.variantId,
									quantity: item.quantity,
									unitPrice: String(item.unitPrice)
								})));
				}

				await tx
					.delete(cartItems)
					.where(eq(cartItems.sessionId, session.cartSessionId));
			}

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

	// Post-transaction: Printful fulfillment (non-blocking — errors logged, not thrown)
	if (fulfillmentClient !== null)
	{
		const [createdOrder] =
			await db
				.select(
					{
						id: orders.id,
						shippingAddress: orders.shippingAddress,
						shippingName: orders.shippingName
					})
				.from(orders)
				.where(eq(orders.stripeSessionId, session.stripeSessionId))
				.limit(1);

		if (createdOrder !== undefined)
		{
			try
			{
				const items: { printfulSyncVariantId: string | null; quantity: number; }[] =
					await db
						.select(
							{
								printfulSyncVariantId: productVariants.printfulSyncVariantId,
								quantity: orderItems.quantity
							})
						.from(orderItems)
						.innerJoin(
							productVariants,
							eq(orderItems.variantId, productVariants.id))
						.where(eq(orderItems.orderId, createdOrder.id));

				const address: ShippingAddress =
					(createdOrder.shippingAddress ?? {}) as ShippingAddress;

				const fulfillmentResult: PrintfulOrderResult =
					await fulfillmentClient(
						{
							shippingName: createdOrder.shippingName ?? "",
							shippingAddress: address,
							items
						});

				await db
					.update(orders)
					.set(
						{
							printfulOrderId: String(fulfillmentResult.id),
							status: "fulfilling",
							updatedAt: getNow()
						})
					.where(eq(orders.id, createdOrder.id));

				await db
					.insert(orderStatusHistory)
					.values(
						{
							orderId: createdOrder.id,
							fromStatus: "paid",
							toStatus: "fulfilling",
							reason: `Printful order ${fulfillmentResult.id} created`
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
						{ status: "fulfillment_error", updatedAt: getNow() })
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
		}
	}

	// Post-transaction: Email confirmation (non-blocking)
	if (emailClient !== null && session.customerEmail !== "")
	{
		try
		{
			const orderForEmail: { id: string; totalAmount: string; }[] =
				await db
					.select(
						{
							id: orders.id,
							totalAmount: orders.totalAmount
						})
					.from(orders)
					.where(eq(orders.stripeSessionId, session.stripeSessionId))
					.limit(1);

			if (orderForEmail[0] !== undefined)
			{
				const itemCount: { quantity: number; }[] =
					await db
						.select(
							{ quantity: orderItems.quantity })
						.from(orderItems)
						.where(eq(orderItems.orderId, orderForEmail[0].id));

				const totalItems: number =
					itemCount.reduce(
						(sum, row) => sum + row.quantity,
						0);

				await emailClient(
					session.customerEmail,
					orderForEmail[0].id,
					String(orderForEmail[0].totalAmount),
					totalItems);
			}
		}
		catch (emailError: unknown)
		{
			console.error(
				"[Brevo] Email error:",
				emailError instanceof Error ? emailError.message : "Unknown");
		}
	}
}