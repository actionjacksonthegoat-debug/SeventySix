/**
 * Shared Zod validation schemas for cart operations.
 * Used by both SvelteKit and TanStack apps for input validation.
 */
import { z } from "zod";
import { MAX_CART_ITEM_QUANTITY } from "../constants";

/**
 * Zod schema for add-to-cart input.
 * Expects typed inputs (number for quantity). For form data, use {@link addToCartFormSchema}.
 */
export const addToCartSchema: z.ZodType<AddToCartInput> =
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
				.min(1)
				.max(MAX_CART_ITEM_QUANTITY)
		});

/** Inferred type for add-to-cart input. */
export type AddToCartInput = { productId: string; variantId: string; quantity: number; };

/**
 * Zod schema for add-to-cart form data (coerces string to number).
 * Used by SvelteKit form actions where FormData values are strings.
 */
export const addToCartFormSchema: z.ZodType<AddToCartInput> =
	z.object(
		{
			productId: z
				.string()
				.uuid(),
			variantId: z
				.string()
				.uuid(),
			quantity: z
				.coerce
				.number()
				.int()
				.min(1)
				.max(MAX_CART_ITEM_QUANTITY)
		});

/**
 * Zod schema for cart item quantity update input.
 * Quantity of 0 means remove the item.
 */
export const updateCartItemSchema: z.ZodType<UpdateCartItemInput> =
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
		});

/** Inferred type for cart item update input. */
export type UpdateCartItemInput = { cartItemId: string; quantity: number; };

/**
 * Zod schema for cart item quantity update from form data (coerces string to number).
 * Used by SvelteKit form actions where FormData values are strings.
 */
export const updateCartItemFormSchema: z.ZodType<UpdateCartItemInput> =
	z.object(
		{
			cartItemId: z
				.string()
				.uuid(),
			quantity: z
				.coerce
				.number()
				.int()
				.min(0)
				.max(MAX_CART_ITEM_QUANTITY)
		});

/**
 * Zod schema for cart item removal input.
 */
export const removeCartItemSchema: z.ZodType<RemoveCartItemInput> =
	z.object(
		{
			cartItemId: z
				.string()
				.uuid()
		});

/** Inferred type for cart item removal input. */
export type RemoveCartItemInput = { cartItemId: string; };