import {
	addToCart as sharedAddToCart,
	type CartItemRow,
	type CartResponse,
	getCartItems,
	removeCartItem,
	toCartResponse,
	updateCartItemQuantity
} from "@seventysixcommerce/shared/cart";
import { futureDate } from "@seventysixcommerce/shared/date";
import { addToCartSchema, removeCartItemSchema, updateCartItemSchema } from "@seventysixcommerce/shared/validation";
import { createServerFn } from "@tanstack/react-start";
import { CART_SESSION_MAX_AGE_SECONDS } from "~/lib/constants";
import { db } from "../db";
import { queueLog } from "../log-forwarder";
import { recordCartAdd, recordCartRemove } from "../metrics";
import { cartSessionMiddleware } from "../middleware/cart-session";
import { csrfMiddleware } from "../middleware/csrf";

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
			addToCartSchema)
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
			updateCartItemSchema)
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
		.inputValidator(removeCartItemSchema)
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