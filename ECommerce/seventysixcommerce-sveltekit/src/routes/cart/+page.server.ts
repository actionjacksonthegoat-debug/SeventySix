import { FREE_SHIPPING_THRESHOLD } from "$lib/constants";
import {
	addToCart,
	getCart,
	removeFromCart,
	updateCartItem
} from "$lib/server/db/cart";
import { queueLog } from "$lib/server/log-forwarder";
import { recordCartAdd, recordCartRemove, recordPageView } from "$lib/server/metrics";
import { toCartResponse } from "@seventysixcommerce/shared/cart";
import {
	addToCartFormSchema,
	removeCartItemSchema,
	updateCartItemFormSchema
} from "@seventysixcommerce/shared/validation";
import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

/** Loads cart contents for display. */
export const load: PageServerLoad =
	async ({ locals }) =>
	{
		recordPageView("cart");
		queueLog(
			{
				logLevel: "Information",
				message: "Page view: cart"
			});

		const cartRows =
			await getCart(locals.cartSessionId);
		const cartResponse =
			toCartResponse(cartRows);
		const subtotal: number =
			parseFloat(cartResponse.subtotal);
		const freeShipping: boolean =
			subtotal >= FREE_SHIPPING_THRESHOLD;

		return { cart: cartResponse.items, itemCount: cartResponse.itemCount, subtotal, freeShipping };
	};

/** Cart page form actions for add, update, and remove operations. */
export const actions: Actions =
	{
	/** Adds an item to the cart. */
		addToCart: async ({ request, locals }) =>
		{
			const formData: FormData =
				await request.formData();
			const parsed =
				addToCartFormSchema.safeParse(
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

			recordCartAdd(parsed.data.productId);
			queueLog(
				{
					logLevel: "Information",
					message:
					`Cart add: product ${parsed.data.productId}, variant ${parsed.data.variantId}, qty ${parsed.data.quantity}`
				});

			return { success: true };
		},

		/** Updates quantity of a cart item. Removes if quantity is 0. */
		updateQuantity: async ({ request, locals }) =>
		{
			const formData: FormData =
				await request.formData();
			const parsed =
				updateCartItemFormSchema.safeParse(
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

			if (parsed.data.quantity === 0)
			{
				recordCartRemove(parsed.data.cartItemId);
				queueLog(
					{
						logLevel: "Information",
						message: `Cart remove: item ${parsed.data.cartItemId}`
					});
			}

			return { success: true };
		},

		/** Removes an item from the cart. */
		removeItem: async ({ request, locals }) =>
		{
			const formData: FormData =
				await request.formData();
			const parsed =
				removeCartItemSchema.safeParse(
					{
						cartItemId: formData.get("cartItemId")
					});

			if (!parsed.success)
			{
				return fail(400,
					{ error: "Invalid input" });
			}

			await removeFromCart(locals.cartSessionId, parsed.data.cartItemId);

			recordCartRemove(parsed.data.cartItemId);
			queueLog(
				{
					logLevel: "Information",
					message: `Cart remove: item ${parsed.data.cartItemId}`
				});

			return { success: true };
		}
	};