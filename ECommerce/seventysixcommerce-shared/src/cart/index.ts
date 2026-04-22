/**
 * Framework-agnostic cart operations.
 * Both SvelteKit and TanStack apps delegate core cart logic here,
 * wrapping with their own middleware and response shaping.
 */
export { type CartItem, type CartResponse, toCartResponse } from "./cart-response";
import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { MAX_CART_ITEM_QUANTITY } from "../constants";
import {
	cartItems,
	cartSessions,
	products,
	productVariants
} from "../schema";
import type * as schema from "../schema";

/** Database instance type for all shared cart operations. */
export type CommerceDb = NodePgDatabase<typeof schema>;

/** Cart item row returned from the cart + product join query. */
export interface CartItemRow
{
	/** Cart item UUID. */
	id: string;
	/** Product UUID. */
	productId: string;
	/** Variant UUID. */
	variantId: string;
	/** Ordered quantity. */
	quantity: number;
	/** Unit price as decimal string. */
	unitPrice: string;
	/** Product display title. */
	productTitle: string;
	/** Product URL slug. */
	productSlug: string;
	/** Variant display name. */
	variantName: string;
	/** Product thumbnail URL. */
	imageUrl: string;
}

/** Result of an addToCart operation. */
export interface AddToCartResult
{
	/** Whether the item was successfully added. */
	success: boolean;
	/** Error message when success is false. */
	error?: string;
}

/**
 * Ensures a cart session exists in the database.
 * Creates one with the given expiry if it doesn't exist yet.
 */
export async function ensureCartSession(
	db: CommerceDb,
	sessionId: string,
	expiresAt: Date): Promise<void>
{
	const existing: { id: string; }[] =
		await db
			.select(
				{ id: cartSessions.id })
			.from(cartSessions)
			.where(eq(cartSessions.id, sessionId))
			.limit(1);

	if (existing.length === 0)
	{
		await db
			.insert(cartSessions)
			.values(
				{
					id: sessionId,
					expiresAt
				});
	}
}

/** Retrieves cart contents with product details for a given session. */
export async function getCartItems(
	db: CommerceDb,
	sessionId: string): Promise<CartItemRow[]>
{
	return db
		.select(
			{
				id: cartItems.id,
				productId: cartItems.productId,
				variantId: cartItems.variantId,
				quantity: cartItems.quantity,
				unitPrice: cartItems.unitPrice,
				productTitle: products.title,
				productSlug: products.slug,
				variantName: productVariants.name,
				imageUrl: products.thumbnailUrl
			})
		.from(cartItems)
		.innerJoin(products, eq(cartItems.productId, products.id))
		.innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
		.where(eq(cartItems.sessionId, sessionId));
}

/**
 * Adds an item to the cart, incrementing quantity if it already exists.
 * Validates product is active and variant is available before adding.
 */
export async function addToCart(
	db: CommerceDb,
	sessionId: string,
	productId: string,
	variantId: string,
	quantity: number,
	expiresAt: Date): Promise<AddToCartResult>
{
	const product: { id: string; basePrice: string; isActive: boolean; }[] =
		await db
			.select(
				{
					id: products.id,
					basePrice: products.basePrice,
					isActive: products.isActive
				})
			.from(products)
			.where(eq(products.id, productId))
			.limit(1);

	if (product.length === 0 || !product[0].isActive)
	{
		return { success: false, error: "Product not available" };
	}

	const variant: { id: string; isAvailable: boolean; }[] =
		await db
			.select(
				{
					id: productVariants.id,
					isAvailable: productVariants.isAvailable
				})
			.from(productVariants)
			.where(
				and(
					eq(productVariants.id, variantId),
					eq(productVariants.productId, productId)))
			.limit(1);

	if (variant.length === 0 || !variant[0].isAvailable)
	{
		return { success: false, error: "Variant not available" };
	}

	if (quantity < 1 || quantity > MAX_CART_ITEM_QUANTITY)
	{
		return { success: false, error: `Quantity must be between 1 and ${MAX_CART_ITEM_QUANTITY}` };
	}

	await ensureCartSession(db, sessionId, expiresAt);

	const existing: { id: string; quantity: number; }[] =
		await db
			.select(
				{ id: cartItems.id, quantity: cartItems.quantity })
			.from(cartItems)
			.where(
				and(
					eq(cartItems.sessionId, sessionId),
					eq(cartItems.variantId, variantId)))
			.limit(1);

	if (existing.length > 0)
	{
		const newQuantity: number =
			Math.min(
				existing[0].quantity + quantity,
				MAX_CART_ITEM_QUANTITY);
		await db
			.update(cartItems)
			.set(
				{ quantity: newQuantity })
			.where(eq(cartItems.id, existing[0].id));
	}
	else
	{
		await db
			.insert(cartItems)
			.values(
				{
					sessionId,
					productId,
					variantId,
					quantity,
					unitPrice: product[0].basePrice
				});
	}

	return { success: true };
}

/**
 * Updates cart item quantity. Removes item if quantity is 0 or less.
 * Clamps to MAX_CART_ITEM_QUANTITY.
 */
export async function updateCartItemQuantity(
	db: CommerceDb,
	sessionId: string,
	cartItemId: string,
	quantity: number): Promise<void>
{
	if (quantity <= 0)
	{
		await db
			.delete(cartItems)
			.where(
				and(
					eq(cartItems.id, cartItemId),
					eq(cartItems.sessionId, sessionId)));
		return;
	}

	const clampedQuantity: number =
		Math.min(quantity, MAX_CART_ITEM_QUANTITY);
	await db
		.update(cartItems)
		.set(
			{ quantity: clampedQuantity })
		.where(
			and(
				eq(cartItems.id, cartItemId),
				eq(cartItems.sessionId, sessionId)));
}

/** Removes an item from the cart by ID, scoped to the session. */
export async function removeCartItem(
	db: CommerceDb,
	sessionId: string,
	cartItemId: string): Promise<void>
{
	await db
		.delete(cartItems)
		.where(
			and(
				eq(cartItems.id, cartItemId),
				eq(cartItems.sessionId, sessionId)));
}