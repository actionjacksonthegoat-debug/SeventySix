/**
 * Shared cart response types and transformation utilities.
 * Both SvelteKit and TanStack apps use these types for their cart API responses.
 */
import type { CartItemRow } from "./index";

/** Cart item with calculated line total for API responses. */
export interface CartItem
{
	/** Cart item UUID. */
	id: string;
	/** Product UUID. */
	productId: string;
	/** Variant UUID. */
	variantId: string;
	/** Product display title. */
	productTitle: string;
	/** Variant display name. */
	variantName: string;
	/** Product thumbnail URL. */
	thumbnailUrl: string;
	/** Ordered quantity. */
	quantity: number;
	/** Unit price as decimal string. */
	unitPrice: string;
	/** Line total (quantity × unitPrice) as decimal string. */
	lineTotal: string;
}

/** Cart response shape shared across commerce apps. */
export interface CartResponse
{
	/** Cart items with calculated line totals. */
	items: CartItem[];
	/** Total number of items across all line items. */
	itemCount: number;
	/** Cart subtotal as decimal string. */
	subtotal: string;
}

/**
 * Transforms raw cart item rows into the unified CartResponse shape.
 * Calculates line totals and aggregates subtotal/item count.
 * @param rows - Raw cart item rows from the database join query.
 * @returns {CartResponse} The structured cart response.
 */
export function toCartResponse(rows: CartItemRow[]): CartResponse
{
	let subtotal: number = 0;

	const items: CartItem[] =
		rows.map(
			(row) =>
			{
				const lineTotal: number =
					parseFloat(row.unitPrice) * row.quantity;
				subtotal += lineTotal;

				return {
					id: row.id,
					productId: row.productId,
					variantId: row.variantId,
					productTitle: row.productTitle,
					variantName: row.variantName,
					thumbnailUrl: row.imageUrl,
					quantity: row.quantity,
					unitPrice: row.unitPrice,
					lineTotal: lineTotal.toFixed(2)
				};
			});

	return {
		items,
		itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
		subtotal: subtotal.toFixed(2)
	};
}