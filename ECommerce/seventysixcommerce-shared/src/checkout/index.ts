/**
 * Framework-agnostic checkout operations.
 * Both SvelteKit and TanStack apps delegate core checkout logic here.
 */
import { eq } from "drizzle-orm";
import type { CommerceDb } from "../cart";
import { CENTS_PER_DOLLAR, FREE_SHIPPING_THRESHOLD, MOCK_ORDER_EMAIL, STANDARD_SHIPPING_CENTS } from "../constants";
import {
	cartItems,
	checkoutSnapshots,
	orderItems,
	orders,
	orderStatusHistory
} from "../schema";
import type { CheckoutSnapshotItem } from "../types/db";
import { isNullOrUndefined } from "../utils/null-check";

/** Validated cart row with current pricing and availability. */
export interface ValidatedCartRow
{
	/** Product UUID. */
	productId: string;
	/** Variant UUID. */
	variantId: string;
	/** Ordered quantity. */
	quantity: number;
	/** Product display title. */
	productTitle: string;
	/** Variant display name. */
	variantName: string;
	/** Product image URL. */
	imageUrl: string;
	/** Current price from database (decimal string). */
	currentPrice: string;
}

/** Stripe line item shape for Checkout session creation. */
export interface StripeLineItem
{
	/** Price data for the line item. */
	price_data: {
		/** Currency code. */
		currency: string;
		/** Product metadata. */
		product_data: {
			/** Product name. */
			name: string;
			/** Variant description. */
			description: string;
			/** Product images. */
			images: string[];
		};
		/** Unit price in cents. */
		unit_amount: number;
	};
	/** Quantity. */
	quantity: number;
}

/** Stripe shipping option shape. */
export interface StripeShippingOption
{
	/** Shipping rate data. */
	shipping_rate_data: {
		/** Rate type. */
		type: "fixed_amount";
		/** Amount details. */
		fixed_amount: {
			/** Shipping cost in cents. */
			amount: number;
			/** Currency code. */
			currency: string;
		};
		/** Display label. */
		display_name: string;
	};
}

/**
 * Builds Stripe line items from validated cart rows.
 * Converts dollar prices to cents for Stripe's API.
 */
export function buildStripeLineItems(
	rows: ValidatedCartRow[]): StripeLineItem[]
{
	return rows.map(
		(row) => ({
			price_data: {
				currency: "usd",
				product_data: {
					name: row.productTitle,
					description: row.variantName,
					images: [row.imageUrl]
				},
				unit_amount: Math.round(
					parseFloat(String(row.currentPrice)) * CENTS_PER_DOLLAR)
			},
			quantity: row.quantity
		}));
}

/**
 * Builds shipping options based on cart subtotal.
 * Free shipping when subtotal >= threshold.
 */
export function buildShippingOptions(
	subtotalDollars: number): StripeShippingOption[]
{
	const isFreeShipping: boolean =
		subtotalDollars >= FREE_SHIPPING_THRESHOLD;

	return [
		{
			shipping_rate_data: {
				type: "fixed_amount",
				fixed_amount: {
					amount: isFreeShipping ? 0 : STANDARD_SHIPPING_CENTS,
					currency: "usd"
				},
				display_name: isFreeShipping
					? "Free Shipping"
					: "Standard Shipping"
			}
		}
	];
}

/**
 * Calculates cart subtotal from validated rows.
 */
export function calculateSubtotal(
	rows: ValidatedCartRow[]): number
{
	return rows.reduce(
		(sum, row) =>
			sum + parseFloat(String(row.currentPrice)) * row.quantity,
		0);
}

/**
 * Creates an immutable checkout snapshot for tamper-proof fulfillment.
 */
export async function createCheckoutSnapshot(
	db: CommerceDb,
	stripeSessionId: string,
	cartSessionId: string,
	items: ValidatedCartRow[]): Promise<void>
{
	const snapshotItems: CheckoutSnapshotItem[] =
		items.map(
			(item) => ({
				productId: item.productId,
				variantId: item.variantId,
				quantity: item.quantity,
				unitPrice: String(item.currentPrice)
			}));

	await db
		.insert(checkoutSnapshots)
		.values(
			{
				stripeSessionId,
				cartSessionId,
				items: snapshotItems
			});
}

/**
 * Creates a mock order directly (for when MOCK_SERVICES is enabled).
 * Mirrors the core transaction from the webhook's handleCheckoutCompleted.
 */
export async function createMockOrder(
	db: CommerceDb,
	stripeSessionId: string,
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
							stripeSessionId,
							cartSessionId,
							email: MOCK_ORDER_EMAIL,
							status: "paid",
							totalAmount: String(
								((amountTotal ?? 0) / 100).toFixed(2)),
							shippingAddress: null,
							shippingName: "Mock Customer"
						})
					.returning();

			if (isNullOrUndefined(order))
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
						items.map(
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