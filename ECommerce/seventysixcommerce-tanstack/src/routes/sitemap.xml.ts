import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { SITE_URL } from "~/lib/constants";
import { db } from "~/server/db";
import * as schema from "~/server/db/schema";

/** Generates a sitemap XML string with all product, category, and static page URLs. */
export const generateSitemap =
	createServerFn(
		{ method: "GET" })
		.handler(
			async (): Promise<string> =>
			{
				const [products, categories] =
					await Promise.all(
						[
							db
								.select(
									{
										slug: schema.products.slug,
										thumbnailUrl: schema.products.thumbnailUrl,
										categorySlug: schema.categories.slug
									})
								.from(schema.products)
								.innerJoin(
									schema.categories,
									eq(schema.products.categoryId, schema.categories.id))
								.where(eq(schema.products.isActive, true)),
							db
								.select(
									{ slug: schema.categories.slug })
								.from(schema.categories)
						]);

				const staticPages: string[] =
					[
						"",
						"about",
						"privacy",
						"terms",
						"returns"
					];

				let xml: string = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
				xml +=
					"<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\" xmlns:image=\"http://www.google.com/schemas/sitemap-image/1.1\">\n";

				for (const page of staticPages)
				{
					xml +=
						`  <url>\n    <loc>${SITE_URL}/${page}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${
							page === "" ? "1.0" : "0.3"
						}</priority>\n  </url>\n`;
				}

				for (const cat of categories)
				{
					xml +=
						`  <url>\n    <loc>${SITE_URL}/shop/${cat.slug}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
				}

				for (const product of products)
				{
					xml +=
						`  <url>\n    <loc>${SITE_URL}/shop/${product.categorySlug}/${product.slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n`;
					xml +=
						`    <image:image>\n      <image:loc>${SITE_URL}${product.thumbnailUrl}</image:loc>\n    </image:image>\n`;
					xml += `  </url>\n`;
				}

				xml += "</urlset>";
				return xml;
			});