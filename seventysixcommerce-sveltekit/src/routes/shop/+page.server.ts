import { getCategories } from "$lib/server/db/products";
import type { PageServerLoad } from "./$types";

/** Shop index — lists all categories. */
export const load: PageServerLoad =
	async () =>
	{
		const categoriesList =
			await getCategories();
		return { categories: categoriesList };
	};