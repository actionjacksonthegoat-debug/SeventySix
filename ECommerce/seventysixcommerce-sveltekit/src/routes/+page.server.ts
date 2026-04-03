import { getCategories, getFeaturedProducts } from "$lib/server/db/products";
import { queueLog } from "$lib/server/log-forwarder";
import { recordPageView } from "$lib/server/metrics";
import type { PageServerLoad } from "./$types";

/** Home page — loads featured products and category navigation. */
export const load: PageServerLoad =
	async () =>
	{
		recordPageView("home");
		queueLog(
			{
				logLevel: "Information",
				message: "Page view: home"
			});

		const [featured, categoriesList] =
			await Promise.all(
				[
					getFeaturedProducts(),
					getCategories()
				]);

		return { featured, categories: categoriesList };
	};