import { CART_EXPIRY_DAYS, MAX_CART_ITEM_QUANTITY } from "$lib/constants";
import { addDays, now } from "$lib/utils/date";
import { and, eq } from "drizzle-orm";
import { db } from "./index";
import { cartItems, cartSessions, products, productVariants } from "./schema";

/** Cart item with associated product details. */
export interface CartItemWithProduct
{
	id: string;
	productId: string;
	variantId: string;
	quantity: number;
	unitPrice: string;
	productTitle: string;
	productSlug: string;
	variantName: string;
	imageUrl: string;
}

/**
 * Ensures a cart session exists in the database.
 * Creates one if it doesn't exist yet.
 */
async function ensureCartSession(sessionId: string): Promise<void>
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
		const expiresAt: Date =
			addDays(now(), CART_EXPIRY_DAYS);

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
export async function getCart(sessionId: string): Promise<CartItemWithProduct[]>
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

/** Adds an item to the cart, incrementing quantity if it already exists. */
export async function addToCart(
	sessionId: string,
	productId: string,
	variantId: string,
	quantity: number): Promise<{ success: boolean; error?: string; }>
{
	// Validate product is active
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

	// Validate variant exists and belongs to product
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

	await ensureCartSession(sessionId);

	// Check if item already exists
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

/** Updates cart item quantity. Removes item if quantity is 0. */
export async function updateCartItem(
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

/** Removes an item from the cart. */
export async function removeFromCart(
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