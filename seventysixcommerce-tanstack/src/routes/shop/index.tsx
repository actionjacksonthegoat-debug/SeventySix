import { createFileRoute, Link } from "@tanstack/react-router";
import type { JSX } from "react";
import { SITE_URL } from "~/lib/constants";
import { getCategories } from "~/server/functions/products";
import type { Category } from "~/server/functions/products";

export const Route =
	createFileRoute("/shop/")(
		{
			loader: async () =>
			{
				const categories: Category[] =
					await getCategories();
				return { categories };
			},
			head: () => ({
				meta: [
					{ title: "Shop — SeventySixCommerce Art Merchandise" },
					{
						name: "description",
						content: "Browse original art merchandise — posters, apparel, mugs and more."
					},
					{
						property: "og:title",
						content: "Shop — SeventySixCommerce Art Merchandise"
					},
					{
						property: "og:description",
						content: "Browse original art merchandise — posters, apparel, mugs and more."
					},
					{ property: "og:type", content: "website" },
					{ property: "og:url", content: `${SITE_URL}/shop` },
					{ name: "twitter:card", content: "summary" },
					{
						name: "twitter:title",
						content: "Shop — SeventySixCommerce Art Merchandise"
					},
					{
						name: "twitter:description",
						content: "Browse original art merchandise — posters, apparel, mugs and more."
					}
				],
				links: [{ rel: "canonical", href: `${SITE_URL}/shop` }]
			}),
			component: ShopPage
		});

function ShopPage(): JSX.Element
{
	const { categories } =
		Route.useLoaderData();

	return (
		<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<h1 className="mb-8 text-3xl font-bold text-text-primary">Shop</h1>
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{categories.map((category: Category) => (
					<Link
						key={category.id}
						to="/shop/$category"
						params={{ category: category.slug }}
						className="group block rounded-lg border border-border p-6 transition-shadow hover:shadow-md"
					>
						<h2 className="mb-2 text-xl font-semibold text-text-primary group-hover:text-text-secondary">
							{category.name}
						</h2>
						{category.description !== null && (
							<p className="mb-4 text-sm text-text-muted">
								{category.description}
							</p>)}
						<span className="text-sm font-medium text-text-primary underline group-hover:no-underline">
							Browse {category.productCount} {category.productCount === 1 ? "product" : "products"} →
						</span>
					</Link>))}
			</div>
		</div>);
}