import { createServerFn } from "@tanstack/react-start";
import { SITE_URL } from "~/lib/constants";

/** robots.txt content — allows all crawlers, blocks API and checkout. */
export const getRobotsTxt =
	createServerFn(
		{ method: "GET" })
		.handler(
			async (): Promise<string> =>
			{
				return [
					"User-agent: *",
					"Allow: /",
					"Disallow: /api/",
					"Disallow: /checkout/",
					"",
					`Sitemap: ${SITE_URL}/sitemap.xml`,
					""
				]
					.join("\n");
			});