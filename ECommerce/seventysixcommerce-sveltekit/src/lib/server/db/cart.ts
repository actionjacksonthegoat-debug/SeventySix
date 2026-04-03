import { CART_EXPIRY_DAYS } from "$lib/constants";
import { addDays, now } from "$lib/utils/date";
import {
	addToCart as sharedAddToCart,
	type AddToCartResult,
	type CartItemRow,
	getCartItems,
	removeCartItem,
	updateCartItemQuantity
} from "@seventysixcommerce/shared/cart";
import { recordCartAdd, recordCartRemove } from "../metrics";
import { db } from "./index";

/** Cart item with associated product details. */
export type CartItemWithProduct = CartItemRow;

/** Retrieves cart contents with product details for a given session. */
export async function getCart(sessionId: string): Promise<CartItemWithProduct[]>
{
	return getCartItems(db, sessionId);
}

/** Adds an item to the cart, incrementing quantity if it already exists. */
export async function addToCart(
	sessionId: string,
	productId: string,
	variantId: string,
	quantity: number): Promise<AddToCartResult>
{
	const expiresAt: Date =
		addDays(now(), CART_EXPIRY_DAYS);

	const result: AddToCartResult =
		await sharedAddToCart(
			db,
			sessionId,
			productId,
			variantId,
			quantity,
			expiresAt);

	if (result.success)
	{
		recordCartAdd(productId);
	}

	return result;
}

/** Updates cart item quantity. Removes item if quantity is 0. */
export async function updateCartItem(
	sessionId: string,
	cartItemId: string,
	quantity: number): Promise<void>
{
	if (quantity === 0)
	{
		recordCartRemove(cartItemId);
	}

	return updateCartItemQuantity(
		db,
		sessionId,
		cartItemId,
		quantity);
}

/** Removes an item from the cart. */
export async function removeFromCart(
	sessionId: string,
	cartItemId: string): Promise<void>
{
	recordCartRemove(cartItemId);

	return removeCartItem(
		db,
		sessionId,
		cartItemId);
}