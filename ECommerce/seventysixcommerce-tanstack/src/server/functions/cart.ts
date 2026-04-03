import {
	addToCart as sharedAddToCart,
	type CartItemRow,
	getCartItems,
	removeCartItem,
	updateCartItemQuantity
} from "@seventysixcommerce/shared/cart";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CART_SESSION_MAX_AGE_SECONDS, MAX_CART_ITEM_QUANTITY } from "~/lib/constants";
import { futureDate } from "~/lib/date";
import { db } from "../db";
import { queueLog } from "../log-forwarder";
import { recordCartAdd, recordCartRemove } from "../metrics";
import { cartSessionMiddleware } from "../middleware/cart-session";
import { csrfMiddleware } from "../middleware/csrf";

/** Cart item with product details. */
export interface CartItem
{
	id: string;
	productId: string;
	variantId: string;
	productTitle: string;
	variantName: string;
	thumbnailUrl: string;
	quantity: number;
	unitPrice: string;
	lineTotal: string;
}

/** Cart response shape. */
export interface CartResponse
{
	items: CartItem[];
	itemCount: number;
	subtotal: string;
}

/** Transforms shared cart rows into the TanStack CartResponse shape. */
function toCartResponse(rows: CartItemRow[]): CartResponse
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

/** Retrieves the current cart contents with product details and pricing. */
export const getCart =
	createServerFn(
		{ method: "GET" })
		.middleware(
			[cartSessionMiddleware])
		.handler(
			async ({ context }): Promise<CartResponse> =>
			{
				const rows: CartItemRow[] =
					await getCartItems(db, context.cartSessionId);

				return toCartResponse(rows);
			});

/** Adds a product variant to the cart, creating or incrementing quantity. */
export const addToCart =
	createServerFn(
		{ method: "POST" })
		.inputValidator(
			z.object(
				{
					productId: z
						.string()
						.uuid(),
					variantId: z
						.string()
						.uuid(),
					quantity: z
						.number()
						.int()
						.positive()
						.max(MAX_CART_ITEM_QUANTITY)
				}))
		.middleware(
			[cartSessionMiddleware, csrfMiddleware])
		.handler(
			async ({ data, context }): Promise<CartResponse> =>
			{
				const expiresAt: Date =
					futureDate(CART_SESSION_MAX_AGE_SECONDS);

				const result =
					await sharedAddToCart(
						db,
						context.cartSessionId,
						data.productId,
						data.variantId,
						data.quantity,
						expiresAt);

				if (!result.success)
				{
					throw new Error(result.error ?? "Failed to add to cart");
				}

				recordCartAdd(data.productId);
				queueLog(
					{
						logLevel: "Information",
						message: `Cart add: product ${data.productId}, variant ${data.variantId}, qty ${data.quantity}`
					});

				const rows: CartItemRow[] =
					await getCartItems(db, context.cartSessionId);

				return toCartResponse(rows);
			});

/** Updates the quantity of an item (0 = remove). */
export const updateCartItem =
	createServerFn(
		{ method: "POST" })
		.inputValidator(
			z.object(
				{
					cartItemId: z
						.string()
						.uuid(),
					quantity: z
						.number()
						.int()
						.min(0)
						.max(MAX_CART_ITEM_QUANTITY)
				}))
		.middleware(
			[cartSessionMiddleware, csrfMiddleware])
		.handler(
			async ({ data, context }): Promise<CartResponse> =>
			{
				if (data.quantity === 0)
				{
					recordCartRemove(data.cartItemId);
					queueLog(
						{
							logLevel: "Information",
							message: `Cart remove: item ${data.cartItemId}`
						});
				}

				await updateCartItemQuantity(
					db,
					context.cartSessionId,
					data.cartItemId,
					data.quantity);

				const rows: CartItemRow[] =
					await getCartItems(db, context.cartSessionId);

				return toCartResponse(rows);
			});

/** Removes an item from the cart. */
export const removeFromCart =
	createServerFn(
		{ method: "POST" })
		.inputValidator(z.object(
			{
				cartItemId: z
					.string()
					.uuid()
			}))
		.middleware(
			[cartSessionMiddleware, csrfMiddleware])
		.handler(
			async ({ data, context }): Promise<CartResponse> =>
			{
				await removeCartItem(
					db,
					context.cartSessionId,
					data.cartItemId);

				recordCartRemove(data.cartItemId);
				queueLog(
					{
						logLevel: "Information",
						message: `Cart remove: item ${data.cartItemId}`
					});

				const rows: CartItemRow[] =
					await getCartItems(db, context.cartSessionId);

				return toCartResponse(rows);
			});