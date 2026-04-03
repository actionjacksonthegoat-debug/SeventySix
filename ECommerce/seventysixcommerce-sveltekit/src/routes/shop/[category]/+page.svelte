<script lang="ts">
	import type { PageData } from "./$types";
	import ProductCard from "$lib/components/product/ProductCard.svelte";
	import JsonLd from "$lib/components/seo/JsonLd.svelte";
	import {
		generateCollectionPageJsonLd,
		generateBreadcrumbJsonLd,
	} from "$lib/utils/seo";

	let { data }: { data: PageData } = $props();

	const breadcrumbItems = $derived([
		{ name: "Home", url: "/" },
		{ name: "Shop", url: "/shop" },
		{ name: data.category.name, url: `/shop/${data.category.slug}` },
	]);
</script>

<svelte:head>
	<title>{data.category.name} — SeventySixCommerce Art Merchandise</title>
	<meta
		name="description"
		content="Browse {data.category.name} art merchandise at SeventySixCommerce."
	/>
	<link rel="canonical" href={`${data.baseUrl}/shop/${data.category.slug}`} />
	<meta property="og:title" content="{data.category.name} — SeventySixCommerce" />
	<meta
		property="og:description"
		content="Browse {data.category.name} art merchandise at SeventySixCommerce."
	/>
	<meta property="og:type" content="website" />
	<meta
		property="og:url"
		content={`${data.baseUrl}/shop/${data.category.slug}`}
	/>
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="{data.category.name} — SeventySixCommerce" />
	<meta
		name="twitter:description"
		content="Browse {data.category.name} art merchandise at SeventySixCommerce."
	/>
</svelte:head>

<JsonLd
	schema={generateCollectionPageJsonLd(
		data.category.name,
		data.category.slug,
		data.products.pagination.total,
		data.baseUrl,
	)}
/>
<JsonLd schema={generateBreadcrumbJsonLd(breadcrumbItems, data.baseUrl)} />

<div class="mx-auto max-w-7xl px-6 py-16">
	<nav class="mb-6 text-sm text-text-muted">
		<a href="/" class="hover:text-text-secondary">Home</a>
		<span class="mx-2">/</span>
		<a href="/shop" class="hover:text-text-secondary">Shop</a>
		<span class="mx-2">/</span>
		<span class="text-text-primary">{data.category.name}</span>
	</nav>

	<h1 class="text-3xl font-bold tracking-tight text-text-primary">
		{data.category.name}
	</h1>
	{#if data.category.description}
		<p class="mt-2 text-text-secondary">{data.category.description}</p>
	{/if}

	{#if data.products.items.length > 0}
		<div class="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
			{#each data.products.items as product}
				<ProductCard
					title={product.title}
					slug={product.slug}
					basePrice={product.basePrice}
					thumbnailUrl={product.thumbnailUrl}
					categorySlug={data.category.slug}
				/>
			{/each}
		</div>

		{#if data.products.pagination.totalPages > 1}
			<nav class="mt-12 flex items-center justify-center gap-2">
				{#if data.page > 1}
					<a
						href="?page={data.page - 1}"
						class="rounded-md border border-border px-4 py-2 text-sm hover:bg-bg-secondary"
					>
						Previous
					</a>
				{/if}
				<span class="text-sm text-text-secondary">
					Page {data.page} of {data.products.pagination.totalPages}
				</span>
				{#if data.page < data.products.pagination.totalPages}
					<a
						href="?page={data.page + 1}"
						class="rounded-md border border-border px-4 py-2 text-sm hover:bg-bg-secondary"
					>
						Next
					</a>
				{/if}
			</nav>
		{/if}
	{:else}
		<p class="mt-8 text-text-muted">No products found in this category.</p>
	{/if}
</div>
