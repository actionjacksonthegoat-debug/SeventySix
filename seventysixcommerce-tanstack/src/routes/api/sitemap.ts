import { createFileRoute } from "@tanstack/react-router";
import { generateSitemap } from "~/routes/sitemap.xml";

/** Sitemap endpoint — returns dynamic XML sitemap with all products and categories. */
export const Route =
	createFileRoute("/api/sitemap")(
		{
			server: {
				handlers: {
					GET: async (): Promise<Response> =>
					{
						const xml: string =
							await generateSitemap();

						return new Response(
							xml,
							{
								headers: {
									"Content-Type": "application/xml; charset=utf-8",
									"Cache-Control": "public, max-age=3600"
								}
							});
					}
				}
			}
		});