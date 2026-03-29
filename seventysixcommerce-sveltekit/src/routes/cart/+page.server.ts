import { FREE_SHIPPING_THRESHOLD, MAX_CART_ITEM_QUANTITY } from "$lib/constants";
import {
	addToCart,
	getCart,
	removeFromCart,
	updateCartItem
} from "$lib/server/db/cart";
import { fail } from "@sveltejs/kit";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";

/** Loads cart contents for display. */
export const load: PageServerLoad =
	async ({ locals }) =>
	{
		const cart =
			await getCart(locals.cartSessionId);
		const subtotal: number =
			cart.reduce(
				(sum, item) =>
					sum + Number(item.unitPrice) * item.quantity,
				0);
		const freeShipping: boolean =
			subtotal >= FREE_SHIPPING_THRESHOLD;

		return { cart, subtotal, freeShipping };
	};

/** Zod schema for add-to-cart form input. */
const addToCartSchema =
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

/** Zod schema for quantity update form input. */
const updateQuantitySchema =
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

/** Zod schema for item removal form input. */
const removeItemSchema =
	z.object(
		{
			cartItemId: z
				.string()
				.uuid()
		});

/** Cart page form actions for add, update, and remove operations. */
export const actions: Actions =
	{
	/** Adds an item to the cart. */
		addToCart: async ({ request, locals }) =>
		{
			const formData: FormData =
				await request.formData();
			const parsed =
				addToCartSchema.safeParse(
					{
						productId: formData.get("productId"),
						variantId: formData.get("variantId"),
						quantity: formData.get("quantity")
					});

			if (!parsed.success)
			{
				return fail(400,
					{ error: "Invalid input" });
			}

			const result =
				await addToCart(
					locals.cartSessionId,
					parsed.data.productId,
					parsed.data.variantId,
					parsed.data.quantity);

			if (!result.success)
			{
				return fail(400,
					{ error: result.error });
			}

			return { success: true };
		},

		/** Updates quantity of a cart item. Removes if quantity is 0. */
		updateQuantity: async ({ request, locals }) =>
		{
			const formData: FormData =
				await request.formData();
			const parsed =
				updateQuantitySchema.safeParse(
					{
						cartItemId: formData.get("cartItemId"),
						quantity: formData.get("quantity")
					});

			if (!parsed.success)
			{
				return fail(400,
					{ error: "Invalid input" });
			}

			await updateCartItem(
				locals.cartSessionId,
				parsed.data.cartItemId,
				parsed.data.quantity);
			return { success: true };
		},

		/** Removes an item from the cart. */
		removeItem: async ({ request, locals }) =>
		{
			const formData: FormData =
				await request.formData();
			const parsed =
				removeItemSchema.safeParse(
					{
						cartItemId: formData.get("cartItemId")
					});

			if (!parsed.success)
			{
				return fail(400,
					{ error: "Invalid input" });
			}

			await removeFromCart(locals.cartSessionId, parsed.data.cartItemId);
			return { success: true };
		}
	};