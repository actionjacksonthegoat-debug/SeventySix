import { env } from "$env/dynamic/private";
import { SITEMAP_CACHE_MAX_AGE } from "$lib/constants";
import { getActiveProducts, getCategories } from "$lib/server/db/products";
import type { RequestHandler } from "./$types";

/** Dynamic sitemap with all product URLs and images. */
export const GET: RequestHandler =
	async () =>
	{
		const baseUrl: string =
			env.BASE_URL ?? "";

		const [allProducts, allCategories] =
			await Promise.all(
				[
					getActiveProducts(),
					getCategories()
				]);

		const staticPages: string[] =
			[
				"",
				"/about",
				"/shop",
				"/policies/privacy",
				"/policies/terms",
				"/policies/returns"
			];

		const xml: string =
			`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${
	staticPages
		.map(
			(path) =>
				`  <url>
    <loc>${baseUrl}${path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${path === "" ? "1.0" : "0.5"}</priority>
  </url>`)
		.join("\n")
}
${
	allCategories
		.map(
			(cat) =>
				`  <url>
    <loc>${baseUrl}/shop/${cat.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`)
		.join("\n")
}
${
	allProducts
		.map(
			(product) =>
				`  <url>
    <loc>${baseUrl}/shop/${product.categorySlug}/${product.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <image:image>
      <image:loc>${baseUrl}${product.thumbnailUrl}</image:loc>
    </image:image>
  </url>`)
		.join("\n")
}
</urlset>`;

		return new Response(xml,
			{
				headers: {
					"Content-Type": "application/xml",
					"Cache-Control": `public, max-age=${SITEMAP_CACHE_MAX_AGE}`
				}
			});
	};