import { env } from "$env/dynamic/private";
import { MAX_CART_ITEM_QUANTITY } from "$lib/constants";
import { addToCart } from "$lib/server/db/cart";
import { getProduct, getRelatedProducts } from "$lib/server/db/products";
import { queueLog } from "$lib/server/log-forwarder";
import { recordCartAdd, recordPageView } from "$lib/server/metrics";
import { generateProductJsonLd } from "$lib/utils/seo";
import { error, fail } from "@sveltejs/kit";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";

/** Product detail page — the money page. Full SSR with complete SEO. */
export const load: PageServerLoad =
	async ({ params }) =>
	{
		recordPageView("product");
		queueLog(
			{
				logLevel: "Information",
				message: `Page view: product ${params.slug}`
			});

		const product =
			await getProduct(params.slug);

		if (product === null)
		{
			error(404, "Product not found");
		}

		const related =
			await getRelatedProducts(product.artPieceId, product.id);
		const jsonLd =
			generateProductJsonLd(product, env.BASE_URL ?? "");

		return { product, related, jsonLd };
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

/** Product page form actions for adding to cart. */
export const actions: Actions =
	{
	/** Adds this product to the cart. */
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

			recordCartAdd(parsed.data.productId);
			queueLog(
				{
					logLevel: "Information",
					message:
					`Cart add: product ${parsed.data.productId}, variant ${parsed.data.variantId}, qty ${parsed.data.quantity}`
				});

			return { success: true, message: "Added to cart" };
		}
	};