import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { CART_SESSION_MAX_AGE_SECONDS, MAX_CART_ITEM_QUANTITY } from "~/lib/constants";
import { futureDate } from "~/lib/date";
import { db } from "../db";
import * as schema from "../db/schema";
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

/** Retrieves the current cart contents with product details and pricing. */
export const getCart =
	createServerFn(
		{ method: "GET" })
		.middleware(
			[cartSessionMiddleware])
		.handler(
			async ({ context }): Promise<CartResponse> =>
			{
				const rows =
					await db
						.select(
							{
								id: schema.cartItems.id,
								productId: schema.cartItems.productId,
								variantId: schema.cartItems.variantId,
								productTitle: schema.products.title,
								variantName: schema.productVariants.name,
								thumbnailUrl: schema.products.thumbnailUrl,
								quantity: schema.cartItems.quantity,
								unitPrice: schema.cartItems.unitPrice
							})
						.from(schema.cartItems)
						.innerJoin(
							schema.products,
							eq(schema.cartItems.productId, schema.products.id))
						.innerJoin(
							schema.productVariants,
							eq(schema.cartItems.variantId, schema.productVariants.id))
						.where(eq(schema.cartItems.sessionId, context.cartSessionId));

				const items: CartItem[] =
					rows.map((row) => ({
						...row,
						unitPrice: String(row.unitPrice),
						lineTotal: (
							parseFloat(String(row.unitPrice)) * row.quantity)
							.toFixed(2)
					}));

				const subtotal: number =
					items.reduce(
						(sum, item) =>
							sum + parseFloat(item.unitPrice) * item.quantity,
						0);

				return {
					items,
					itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
					subtotal: subtotal.toFixed(2)
				};
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
				const product =
					await db
						.select(
							{
								id: schema.products.id,
								basePrice: schema.products.basePrice
							})
						.from(schema.products)
						.where(
							and(
								eq(schema.products.id, data.productId),
								eq(schema.products.isActive, true)))
						.limit(1);

				if (product.length === 0)
				{
					throw new Error("Product not found or inactive");
				}

				const variant =
					await db
						.select(
							{ id: schema.productVariants.id })
						.from(schema.productVariants)
						.where(
							and(
								eq(schema.productVariants.id, data.variantId),
								eq(schema.productVariants.productId, data.productId),
								eq(schema.productVariants.isAvailable, true)))
						.limit(1);

				if (variant.length === 0)
				{
					throw new Error("Variant not found or unavailable");
				}

				// Ensure cart session exists in DB
				const sessionExists =
					await db
						.select(
							{ id: schema.cartSessions.id })
						.from(schema.cartSessions)
						.where(eq(schema.cartSessions.id, context.cartSessionId))
						.limit(1);

				if (sessionExists.length === 0)
				{
					await db
						.insert(schema.cartSessions)
						.values(
							{
								id: context.cartSessionId,
								expiresAt: futureDate(CART_SESSION_MAX_AGE_SECONDS)
							});
				}

				// Check if item already exists in cart
				const existingItem =
					await db
						.select(
							{
								id: schema.cartItems.id,
								quantity: schema.cartItems.quantity
							})
						.from(schema.cartItems)
						.where(
							and(
								eq(schema.cartItems.sessionId, context.cartSessionId),
								eq(schema.cartItems.variantId, data.variantId)))
						.limit(1);

				if (existingItem.length > 0)
				{
					const newQty: number =
						Math.min(
							existingItem[0]!.quantity + data.quantity,
							MAX_CART_ITEM_QUANTITY);
					await db
						.update(schema.cartItems)
						.set(
							{ quantity: newQty })
						.where(eq(schema.cartItems.id, existingItem[0]!.id));
				}
				else
				{
					await db
						.insert(schema.cartItems)
						.values(
							{
								sessionId: context.cartSessionId,
								productId: data.productId,
								variantId: data.variantId,
								quantity: data.quantity,
								unitPrice: String(product[0]!.basePrice)
							});
				}

				return getCart(
					{ data: undefined });
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
				const item =
					await db
						.select(
							{ id: schema.cartItems.id })
						.from(schema.cartItems)
						.innerJoin(
							schema.cartSessions,
							eq(schema.cartItems.sessionId, schema.cartSessions.id))
						.where(
							and(
								eq(schema.cartItems.id, data.cartItemId),
								eq(schema.cartItems.sessionId, context.cartSessionId)))
						.limit(1);

				if (item.length === 0)
				{
					throw new Error("Cart item not found");
				}

				if (data.quantity === 0)
				{
					await db
						.delete(schema.cartItems)
						.where(eq(schema.cartItems.id, data.cartItemId));
				}
				else
				{
					await db
						.update(schema.cartItems)
						.set(
							{ quantity: data.quantity })
						.where(eq(schema.cartItems.id, data.cartItemId));
				}

				return getCart(
					{ data: undefined });
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
				await db
					.delete(schema.cartItems)
					.where(
						and(
							eq(schema.cartItems.id, data.cartItemId),
							eq(schema.cartItems.sessionId, context.cartSessionId)));

				return getCart(
					{ data: undefined });
			});