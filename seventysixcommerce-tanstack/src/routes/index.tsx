import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import type { JSX } from "react";
import { generateWebSiteJsonLd } from "~/components/seo/json-ld";
import { JsonLd } from "~/components/seo/JsonLd";
import { SITE_URL } from "~/lib/constants";
import {
	getCategories,
	getFeaturedProducts
} from "~/server/functions/products";
import type { Category, Product } from "~/server/functions/products";
import { queueLog } from "~/server/log-forwarder";
import { recordPageView } from "~/server/metrics";

export const Route =
	createFileRoute("/")(
		{
			loader: async () =>
			{
				recordPageView("home");
				queueLog(
					{
						logLevel: "Information",
						message: "Page view: home"
					});

				const [featured, categories] =
					await Promise.all(
						[
							getFeaturedProducts(),
							getCategories()
						]);
				return { featured, categories };
			},
			head: () => ({
				meta: [
					{ title: "SeventySixCommerce — Original Art on Everyday Things" },
					{
						name: "description",
						content:
						"Discover unique art printed on t-shirts, posters, mugs, and more. Original designs, print-on-demand."
					},
					{
						property: "og:title",
						content: "SeventySixCommerce — Original Art on Everyday Things"
					},
					{
						property: "og:description",
						content:
						"Discover unique art printed on t-shirts, posters, mugs, and more. Original designs, print-on-demand."
					},
					{ property: "og:type", content: "website" },
					{
						property: "og:url",
						content: `${SITE_URL}/`
					},
					{
						property: "og:image",
						content: `${SITE_URL}/api/placeholder/1200/630/SeventySixCommerce`
					},
					{ name: "twitter:card", content: "summary_large_image" },
					{
						name: "twitter:title",
						content: "SeventySixCommerce — Original Art on Everyday Things"
					},
					{
						name: "twitter:description",
						content:
						"Discover unique art printed on t-shirts, posters, mugs, and more. Original designs, print-on-demand."
					}
				],
				links: [{ rel: "canonical", href: `${SITE_URL}/` }]
			}),
			component: HomePage
		});

function HomePage(): JSX.Element
{
	const { featured, categories } =
		useLoaderData(
			{ from: "/" });

	return (
		<div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
			<JsonLd data={generateWebSiteJsonLd()} />

			<section className="py-16 text-center">
				<h1 className="mb-4 text-4xl font-bold text-text-primary sm:text-5xl">
					Art You Can Wear, Display &amp; Use
				</h1>
				<p className="mx-auto mb-8 max-w-2xl text-lg text-text-secondary">
					Original artwork printed on high-quality merchandise. Every purchase supports independent artists.
				</p>
				<Link
					to="/shop/$category"
					params={{ category: "posters" }}
					className="inline-block rounded-lg bg-text-primary px-8 py-3 font-semibold text-bg-primary transition-colors hover:bg-text-primary"
				>
					Browse Collection
				</Link>
			</section>

			{featured.length > 0 && (
				<section className="py-12">
					<h2 className="mb-8 text-center text-2xl font-bold text-text-primary">
						Featured Products
					</h2>
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{featured.map((product: Product) => (
							<Link
								key={product.id}
								to="/shop/$category/$slug"
								params={{ category: product.categorySlug, slug: product.slug }}
								className="group rounded-lg border border-border p-4 transition-shadow hover:shadow-lg"
							>
								<img
									src={product.thumbnailUrl}
									alt={product.title}
									width={400}
									height={400}
									className="mb-4 aspect-square w-full rounded-md object-cover"
									loading="lazy"
									decoding="async"
								/>
								<h3 className="font-semibold text-text-primary group-hover:text-text-secondary">
									{product.title}
								</h3>
								<p className="text-text-secondary">
									${product.basePrice}
								</p>
							</Link>))}
					</div>
				</section>)}

			{categories.length > 0 && (
				<section className="py-12">
					<h2 className="mb-8 text-center text-2xl font-bold text-text-primary">
						Shop by Category
					</h2>
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{categories.map((category: Category) => (
							<Link
								key={category.id}
								to="/shop/$category"
								params={{ category: category.slug }}
								className="rounded-lg border border-border p-6 text-center transition-shadow hover:shadow-lg"
							>
								<h3 className="text-xl font-semibold text-text-primary">
									{category.name}
								</h3>
								<p className="mt-2 text-text-secondary">
									{category.description}
								</p>
								<p className="mt-2 text-sm text-text-muted">
									{category.productCount} products
								</p>
							</Link>))}
					</div>
				</section>)}

			<section className="grid grid-cols-1 gap-8 py-12 sm:grid-cols-2 lg:grid-cols-3">
				<div className="p-6 text-center">
					<h3 className="mb-2 font-semibold text-text-primary">
						Original Art
					</h3>
					<p className="text-text-secondary">
						Every design is an original piece of artwork, not clip art.
					</p>
				</div>
				<div className="p-6 text-center">
					<h3 className="mb-2 font-semibold text-text-primary">
						Premium Quality
					</h3>
					<p className="text-text-secondary">
						Printed on Bella+Canvas, high-quality paper, and premium ceramics.
					</p>
				</div>
				<div className="p-6 text-center">
					<h3 className="mb-2 font-semibold text-text-primary">
						Made to Order
					</h3>
					<p className="text-text-secondary">
						Every item is printed fresh when you order — zero waste.
					</p>
				</div>
			</section>
		</div>);
}