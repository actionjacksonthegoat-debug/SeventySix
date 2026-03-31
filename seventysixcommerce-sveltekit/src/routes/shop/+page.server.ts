import { getCategories } from "$lib/server/db/products";
import { queueLog } from "$lib/server/log-forwarder";
import { recordPageView } from "$lib/server/metrics";
import type { PageServerLoad } from "./$types";

/** Shop index — lists all categories. */
export const load: PageServerLoad =
	async () =>
	{
		recordPageView("shop");
		queueLog(
			{
				logLevel: "Information",
				message: "Page view: shop"
			});

		const categoriesList =
			await getCategories();
		return { categories: categoriesList };
	};