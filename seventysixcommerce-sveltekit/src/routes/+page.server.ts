import { getCategories, getFeaturedProducts } from "$lib/server/db/products";
import type { PageServerLoad } from "./$types";

/** Home page — loads featured products and category navigation. */
export const load: PageServerLoad =
	async () =>
	{
		const [featured, categoriesList] =
			await Promise.all(
				[
					getFeaturedProducts(),
					getCategories()
				]);

		return { featured, categories: categoriesList };
	};