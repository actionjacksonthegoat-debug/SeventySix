import { createFileRoute } from "@tanstack/react-router";
import type { JSX } from "react";
import { SITE_URL } from "~/lib/constants";

export const Route =
	createFileRoute("/about")(
		{
			head: () => ({
				meta: [
					{ title: "About \u2014 SeventySixCommerce" },
					{
						name: "description",
						content:
						"Learn about SeventySixCommerce \u2014 art-inspired merchandise celebrating the places that matter to you."
					},
					{
						property: "og:title",
						content: "About \u2014 SeventySixCommerce"
					},
					{
						property: "og:description",
						content:
						"Learn about SeventySixCommerce \u2014 art-inspired merchandise celebrating the places that matter to you."
					},
					{ property: "og:type", content: "website" },
					{ property: "og:url", content: `${SITE_URL}/about` },
					{ name: "twitter:card", content: "summary" }
				],
				links: [
					{ rel: "canonical", href: `${SITE_URL}/about` }
				]
			}),
			component: AboutPage
		});

/** About page with brand story. */
function AboutPage(): JSX.Element
{
	return (
		<main className="mx-auto max-w-3xl px-4 py-16">
			<h1 className="mb-6 text-3xl font-bold">About SeventySixCommerce</h1>
			<p className="mb-4 text-lg leading-relaxed text-text-secondary">
				SeventySixCommerce transforms original digital artwork into premium merchandise you can hold, wear, and
				display. Every product begins as a unique piece of art, then gets printed on demand using high-quality
				materials.
			</p>
			<p className="mb-4 text-lg leading-relaxed text-text-secondary">
				We believe art should be accessible. Our print-on-demand model means zero waste — each item is created
				just for you when you order. No overstock, no landfill.
			</p>
			<p className="text-lg leading-relaxed text-text-secondary">
				Based in the USA, shipped worldwide. Quality guaranteed.
			</p>
		</main>);
}