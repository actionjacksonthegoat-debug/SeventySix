import { getCategoryBySlug, getProducts } from "$lib/server/db/products";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

/** Category page — loads products filtered by category with pagination. */
export const load: PageServerLoad =
	async ({ params, url }) =>
	{
		const page: number =
			Number(url.searchParams.get("page") ?? "1");
		const category =
			await getCategoryBySlug(params.category);

		if (category === null)
		{
			error(404, "Category not found");
		}

		const productsResult =
			await getProducts(
				{
					category: params.category,
					page,
					limit: 24
				});

		return { category, products: productsResult, page };
	};