<script lang="ts">
	import type { PageData } from "./$types";
	import { enhance } from "$app/forms";
	import ProductCard from "$lib/components/product/ProductCard.svelte";
	import JsonLd from "$lib/components/seo/JsonLd.svelte";
	import { untrack } from "svelte";
	import { generateBreadcrumbJsonLd } from "$lib/utils/seo";

	let { data }: { data: PageData } = $props();

	let selectedVariantId: string = $state(
		untrack(
			() =>
				data.product.variants.find((variant) => variant.isAvailable)
					?.id ??
				data.product.variants[0]?.id ??
				"",
		),
	);

	const formattedPrice: string = $derived(
		`$${Number(data.product.basePrice).toFixed(2)}`,
	);

	const breadcrumbItems = $derived([
		{ name: "Home", url: "/" },
		{ name: "Shop", url: "/shop" },
		{
			name: data.product.categoryName,
			url: `/shop/${data.product.categorySlug}`,
		},
		{
			name: data.product.title,
			url: `/shop/${data.product.categorySlug}/${data.product.slug}`,
		},
	]);
</script>

<svelte:head>
	<title>{data.product.title} | SeventySixCommerce</title>
	<meta
		name="description"
		content={data.product.seoDescription ?? data.product.description}
	/>
	<link
		rel="canonical"
		href={`${data.baseUrl}/shop/${data.product.categorySlug}/${data.product.slug}`}
	/>
	<meta property="og:title" content={data.product.title} />
	<meta
		property="og:description"
		content={data.product.seoDescription ?? data.product.description}
	/>
	<meta property="og:type" content="product" />
	<meta
		property="og:url"
		content={`${data.baseUrl}/shop/${data.product.categorySlug}/${data.product.slug}`}
	/>
	<meta
		property="og:image"
		content={data.product.ogImageUrl ?? data.product.thumbnailUrl}
	/>
	<meta property="product:price:amount" content={data.product.basePrice} />
	<meta property="product:price:currency" content="USD" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={data.product.title} />
	<meta
		name="twitter:description"
		content={data.product.seoDescription ?? data.product.description}
	/>
	<meta
		name="twitter:image"
		content={data.product.ogImageUrl ?? data.product.thumbnailUrl}
	/>
</svelte:head>

<JsonLd schema={data.jsonLd} />
<JsonLd schema={generateBreadcrumbJsonLd(breadcrumbItems, data.baseUrl)} />

<div class="mx-auto max-w-7xl px-6 py-16">
	<nav class="mb-6 text-sm text-text-muted">
		<a href="/" class="hover:text-text-secondary">Home</a>
		<span class="mx-2">/</span>
		<a href="/shop" class="hover:text-text-secondary">Shop</a>
		<span class="mx-2">/</span>
		<a href="/shop/{data.product.categorySlug}" class="hover:text-text-secondary"
			>{data.product.categoryName}</a
		>
		<span class="mx-2">/</span>
		<span class="text-text-primary">{data.product.title}</span>
	</nav>

	<div class="grid grid-cols-1 gap-12 lg:grid-cols-2">
		<!-- Product Image -->
		<div class="aspect-square overflow-hidden rounded-lg bg-bg-tertiary">
			<img
				src={data.product.thumbnailUrl}
				alt={data.product.title}
				width="600"
				height="600"
				class="h-full w-full object-cover"
			/>
		</div>

		<!-- Product Info -->
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-text-primary">
				{data.product.title}
			</h1>
			<p class="mt-4 text-2xl text-text-primary">{formattedPrice}</p>
			<p class="mt-4 text-text-secondary">{data.product.description}</p>

			<!-- Variant Selector -->
			{#if data.product.variants.length > 0}
				<div class="mt-6">
					<label
						for="variant"
						class="block text-sm font-medium text-text-secondary"
						>Option</label
					>
					<select
						id="variant"
						bind:value={selectedVariantId}
						class="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-accent focus:ring-accent"
					>
						{#each data.product.variants as variant}
							<option
								value={variant.id}
								disabled={!variant.isAvailable}
							>
								{variant.name}{variant.isAvailable
									? ""
									: " (Sold Out)"}
							</option>
						{/each}
					</select>
				</div>
			{/if}

			<!-- Add to Cart form action with progressive enhancement -->
			<form method="POST" action="?/addToCart" use:enhance class="mt-8">
				<input type="hidden" name="productId" value={data.product.id} />
				<input
					type="hidden"
					name="variantId"
					value={selectedVariantId}
				/>
				<input type="hidden" name="quantity" value="1" />
				<button
					type="submit"
					class="w-full rounded-md bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-accent-hover disabled:opacity-50"
					disabled={!data.product.variants.some(
						(variant) => variant.isAvailable,
					)}
				>
					{data.product.variants.some(
						(variant) => variant.isAvailable,
					)
						? "Add to Cart"
						: "Sold Out"}
				</button>
			</form>

			<!-- Art Piece Story -->
			<div class="mt-10 border-t border-border pt-8">
				<h2 class="text-lg font-semibold text-text-primary">The Art</h2>
				<h3 class="mt-2 font-medium text-text-primary">
					{data.product.artPieceTitle}
				</h3>
				<p class="mt-2 text-sm text-text-secondary">
					{data.product.artPieceDescription}
				</p>
			</div>
		</div>
	</div>

	<!-- Related Products -->
	{#if data.related.length > 0}
		<section class="mt-20">
			<h2 class="text-2xl font-bold tracking-tight text-text-primary">
				You Might Also Like
			</h2>
			<div
				class="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4"
			>
				{#each data.related as product}
					<ProductCard
						title={product.title}
						slug={product.slug}
						basePrice={product.basePrice}
						thumbnailUrl={product.thumbnailUrl}
						categorySlug={product.categorySlug}
					/>
				{/each}
			</div>
		</section>
	{/if}
</div>
