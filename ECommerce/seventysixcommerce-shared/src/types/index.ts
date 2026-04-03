/**
 * Shared TypeScript interfaces for the commerce apps.
 * Types defined identically in both SvelteKit and TanStack are extracted here.
 */

/** Result from creating a Printful fulfillment order. */
export interface PrintfulOrderResult
{
	id: number;
	status: string;
}

/** Shipping address structure for Printful recipient. */
export interface ShippingAddress
{
	line1?: string;
	city?: string;
	state?: string;
	postal_code?: string;
	country?: string;
}

/** Order with items needed for Printful submission. */
export interface OrderForFulfillment
{
	shippingName: string;
	shippingAddress: ShippingAddress;
	items: ReadonlyArray<{
		printfulSyncVariantId: string | null;
		quantity: number;
	}>;
}

export { ORDER_STATUSES } from "./db";
export type { CheckoutSnapshotItem, OrderStatus } from "./db";