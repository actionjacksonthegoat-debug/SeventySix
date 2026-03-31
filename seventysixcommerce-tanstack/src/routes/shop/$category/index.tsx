import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import type { JSX } from "react";
import {
	generateBreadcrumbJsonLd,
	generateCollectionPageJsonLd
} from "~/components/seo/json-ld";
import { JsonLd } from "~/components/seo/JsonLd";
import { SITE_URL } from "~/lib/constants";
import { getCategories, getProducts } from "~/server/functions/products";
import type { Category, Product } from "~/server/functions/products";
import { queueLog } from "~/server/log-forwarder";
import { recordPageView } from "~/server/metrics";

export const Route =
	createFileRoute("/shop/$category/")(
		{
			loader: async ({ params }) =>
			{
				recordPageView("category");
				queueLog(
					{
						logLevel: "Information",
						message: `Page view: category ${params.category}`
					});

				const [productsResult, categories] =
					await Promise.all(
						[
							getProducts(
								{
									data: { category: params.category, page: 1, limit: 24 }
								}),
							getCategories()
						]);
				const currentCategory: Category | undefined =
					categories.find(
						(category: Category) =>
							category.slug === params.category);
				return {
					productsResult,
					categories,
					currentCategory,
					categorySlug: params.category
				};
			},
			head: ({ loaderData }) =>
			{
				const categoryName: string =
					loaderData?.currentCategory?.name ?? "Shop";
				return {
					meta: [
						{ title: `${categoryName} — SeventySixCommerce Art Merchandise` },
						{
							name: "description",
							content:
							`Browse our ${categoryName.toLowerCase()} collection. Original art printed on premium merchandise.`
						},
						{
							property: "og:title",
							content: `${categoryName} — SeventySixCommerce`
						},
						{
							property: "og:description",
							content:
							`Browse our ${categoryName.toLowerCase()} collection. Original art printed on premium merchandise.`
						},
						{ property: "og:type", content: "website" },
						{
							property: "og:url",
							content: `${SITE_URL}/shop/${loaderData?.categorySlug ?? ""}`
						},
						{ name: "twitter:card", content: "summary" },
						{
							name: "twitter:title",
							content: `${categoryName} — SeventySixCommerce`
						},
						{
							name: "twitter:description",
							content:
							`Browse our ${categoryName.toLowerCase()} collection. Original art printed on premium merchandise.`
						}
					],
					links: [
						{
							rel: "canonical",
							href: `${SITE_URL}/shop/${loaderData?.categorySlug ?? ""}`
						}
					]
				};
			},
			component: CategoryPage
		});

function CategoryPage(): JSX.Element
{
	const { productsResult, currentCategory, categorySlug } =
		useLoaderData(
			{
				from: "/shop/$category/"
			});

	const categoryName: string =
		currentCategory?.name ?? "Shop";

	return (
		<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<JsonLd
				data={generateCollectionPageJsonLd(
					categoryName,
					categorySlug,
					productsResult.items)}
			/>
			<JsonLd
				data={generateBreadcrumbJsonLd(
					[
						{ name: "Home", url: `${SITE_URL}/` },
						{ name: "Shop", url: `${SITE_URL}/shop` },
						{
							name: categoryName,
							url: `${SITE_URL}/shop/${categorySlug}`
						}
					])}
			/>

			<nav className="mb-6 text-sm text-text-muted" aria-label="Breadcrumb">
				<ol className="flex items-center gap-2">
					<li>
						<Link to="/" className="hover:text-text-secondary">
							Home
						</Link>
					</li>
					<li aria-hidden="true">/</li>
					<li className="font-medium text-text-primary">
						{categoryName}
					</li>
				</ol>
			</nav>

			<h1 className="mb-8 text-3xl font-bold text-text-primary">
				{categoryName}
			</h1>

			{productsResult.items.length === 0
				? (
					<p className="text-center text-text-muted">
						No products found in this category.
					</p>)
				: (
					<div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
						{productsResult.items.map((product: Product) => (
							<Link
								key={product.id}
								to="/shop/$category/$slug"
								params={{ category: categorySlug, slug: product.slug }}
								className="group rounded-lg border border-border p-3 transition-shadow hover:shadow-lg"
							>
								<img
									src={product.thumbnailUrl}
									alt={product.title}
									width={400}
									height={400}
									className="mb-3 aspect-square w-full rounded-md object-cover"
									loading="lazy"
									decoding="async"
								/>
								<h2 className="text-sm font-semibold text-text-primary group-hover:text-text-secondary">
									{product.title}
								</h2>
								<p className="mt-1 text-sm text-text-secondary">
									${product.basePrice}
								</p>
							</Link>))}
					</div>)}

			{productsResult.totalPages > 1 && (
				<nav
					className="mt-8 flex justify-center gap-2"
					aria-label="Pagination"
				>
					{Array.from(
						{ length: productsResult.totalPages },
						(_, i: number) => (
							<Link
								key={i + 1}
								to="/shop/$category"
								params={{ category: categorySlug }}
								search={{ page: i + 1 }}
								className={`rounded px-3 py-1 text-sm ${
									productsResult.page === i + 1
										? "bg-text-primary text-bg-primary"
										: "bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary"
								}`}
							>
								{i + 1}
							</Link>))}
				</nav>)}
		</div>);
}