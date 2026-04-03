/**
 * Shared order status values matching the database enum.
 * Both SvelteKit and TanStack apps use identical status lifecycles.
 */
export const ORDER_STATUSES: readonly [
	"pending",
	"paid",
	"fulfilling",
	"shipped",
	"delivered",
	"cancelled",
	"refunded",
	"fulfillment_error"
] =
	[
		"pending",
		"paid",
		"fulfilling",
		"shipped",
		"delivered",
		"cancelled",
		"refunded",
		"fulfillment_error"
	] as const;

/** Union type of all valid order status values. */
export type OrderStatus = typeof ORDER_STATUSES[number];

/** Checkout snapshot item shape stored as JSONB. */
export interface CheckoutSnapshotItem
{
	/** Product UUID. */
	productId: string;
	/** Variant UUID. */
	variantId: string;
	/** Ordered quantity. */
	quantity: number;
	/** Unit price as a decimal string. */
	unitPrice: string;
}