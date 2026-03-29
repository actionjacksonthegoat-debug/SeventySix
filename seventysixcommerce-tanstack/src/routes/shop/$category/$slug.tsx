import {
	createFileRoute,
	Link,
	useLoaderData,
	useRouter
} from "@tanstack/react-router";
import { useState } from "react";
import type { JSX } from "react";
import {
	generateBreadcrumbJsonLd,
	generateProductJsonLd
} from "~/components/seo/json-ld";
import { JsonLd } from "~/components/seo/JsonLd";
import { SITE_URL } from "~/lib/constants";
import { addToCart } from "~/server/functions/cart";
import { getProduct } from "~/server/functions/products";
import type {
	ProductDetail,
	ProductVariant
} from "~/server/functions/products";

export const Route =
	createFileRoute("/shop/$category/$slug")(
		{
			loader: async ({ params }) =>
			{
				const product: ProductDetail | null =
					await getProduct(
						{
							data: { slug: params.slug }
						});
				if (product === null)
				{
					throw new Error("Product not found");
				}
				return { product, categorySlug: params.category };
			},
			head: ({ loaderData }) =>
			{
				const product =
					loaderData?.product;
				const categorySlug =
					loaderData?.categorySlug;
				if (product === null || product === undefined) return { meta: [] };
				return {
					meta: [
						{ title: `${product.title} — SeventySixCommerce` },
						{
							name: "description",
							content: product.seoDescription ?? product.description
						},
						{ property: "og:title", content: product.title },
						{
							property: "og:description",
							content: product.seoDescription ?? product.description
						},
						{ property: "og:type", content: "product" },
						{
							property: "og:url",
							content: `${SITE_URL}/shop/${categorySlug}/${product.slug}`
						},
						{
							property: "og:image",
							content: `${SITE_URL}${product.ogImageUrl ?? product.thumbnailUrl}`
						},
						{
							property: "product:price:amount",
							content: product.basePrice
						},
						{ property: "product:price:currency", content: "USD" },
						{ name: "twitter:card", content: "summary_large_image" },
						{ name: "twitter:title", content: product.title },
						{
							name: "twitter:description",
							content: product.seoDescription ?? product.description
						},
						{
							name: "twitter:image",
							content: `${SITE_URL}${product.ogImageUrl ?? product.thumbnailUrl}`
						}
					],
					links: [
						{
							rel: "canonical",
							href: `${SITE_URL}/shop/${categorySlug}/${product.slug}`
						}
					]
				};
			},
			component: ProductDetailPage
		});

function ProductDetailPage(): JSX.Element
{
	const { product, categorySlug } =
		useLoaderData(
			{
				from: "/shop/$category/$slug"
			});
	const router =
		useRouter();
	const [selectedVariant, setSelectedVariant] =
		useState<ProductVariant | null>(product.variants[0] ?? null);
	const [adding, setAdding] =
		useState<boolean>(false);

	/** Adds the selected variant to the cart and refreshes loader data. */
	async function handleAddToCart(): Promise<void>
	{
		if (selectedVariant === null) return;
		setAdding(true);
		try
		{
			await addToCart(
				{
					data: {
						productId: product.id,
						variantId: selectedVariant.id,
						quantity: 1
					}
				});
			await router.invalidate();
		}
		finally
		{
			setAdding(false);
		}
	}

	return (
		<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<JsonLd data={generateProductJsonLd(product, categorySlug)} />
			<JsonLd
				data={generateBreadcrumbJsonLd(
					[
						{ name: "Home", url: `${SITE_URL}/` },
						{
							name: product.categoryName,
							url: `${SITE_URL}/shop/${categorySlug}`
						},
						{
							name: product.title,
							url: `${SITE_URL}/shop/${categorySlug}/${product.slug}`
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
					<li>
						<Link
							to="/shop/$category"
							params={{ category: categorySlug }}
							className="hover:text-text-secondary"
						>
							{product.categoryName}
						</Link>
					</li>
					<li aria-hidden="true">/</li>
					<li className="font-medium text-text-primary">
						{product.title}
					</li>
				</ol>
			</nav>

			<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
				<div>
					<img
						src={product.thumbnailUrl}
						alt={product.title}
						width={600}
						height={600}
						className="aspect-square w-full rounded-lg object-cover"
					/>
					<div className="mt-4">
						<h3 className="mb-2 text-sm font-medium text-text-muted">
							The Artwork
						</h3>
						<p className="text-sm text-text-secondary">
							{product.artPieceDescription}
						</p>
					</div>
				</div>

				<div>
					<h1 className="mb-2 text-3xl font-bold text-text-primary">
						{product.title}
					</h1>
					<p className="mb-4 text-2xl font-semibold text-text-primary">
						${product.basePrice}
					</p>
					<p className="mb-6 text-text-secondary">{product.description}</p>

					{product.variants.length > 1 && (
						<div className="mb-6">
							<label className="mb-2 block text-sm font-medium text-text-secondary">
								Select Size
							</label>
							<div className="flex flex-wrap gap-2">
								{product.variants.map(
									(variant: ProductVariant) => (
										<button
											key={variant.id}
											type="button"
											disabled={!variant.isAvailable}
											onClick={() => setSelectedVariant(variant)}
											className={`rounded-md border px-4 py-2 text-sm transition-colors ${
												selectedVariant?.id
													=== variant.id
													? "border-text-primary bg-text-primary text-bg-primary"
													: variant.isAvailable
														? "border-border bg-bg-primary text-text-secondary hover:border-border"
														: "cursor-not-allowed border-border bg-bg-tertiary text-text-muted"
											}`}
											aria-pressed={selectedVariant?.id
												=== variant.id}
										>
											{variant.name}
										</button>))}
							</div>
						</div>)}

					<button
						type="button"
						disabled={selectedVariant === null || adding}
						onClick={handleAddToCart}
						className="w-full rounded-lg bg-text-primary px-8 py-3 font-semibold text-bg-primary transition-colors hover:bg-text-primary disabled:cursor-not-allowed disabled:opacity-50"
					>
						{adding ? "Adding..." : "Add to Cart"}
					</button>
				</div>
			</div>
		</div>);
}