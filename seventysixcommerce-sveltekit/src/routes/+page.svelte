<script lang="ts">
	import type { PageData } from "./$types";
	import ProductCard from "$lib/components/product/ProductCard.svelte";
	import JsonLd from "$lib/components/seo/JsonLd.svelte";
	import { generateWebSiteJsonLd } from "$lib/utils/seo";

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>SeventySixCommerce — Original Art on Everyday Things</title>
	<meta
		name="description"
		content="Discover unique art merchandise — prints, apparel, and accessories featuring original artwork."
	/>
	<link rel="canonical" href={`${data.baseUrl}/`} />
	<meta
		property="og:title"
		content="SeventySixCommerce — Original Art on Everyday Things"
	/>
	<meta
		property="og:description"
		content="Discover unique art merchandise — prints, apparel, and accessories featuring original artwork."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:url" content={`${data.baseUrl}/`} />
	<meta
		property="og:image"
		content={`${data.baseUrl}/api/placeholder/1200/630/SeventySixCommerce`}
	/>
	<meta name="twitter:card" content="summary_large_image" />
	<meta
		name="twitter:title"
		content="SeventySixCommerce — Original Art on Everyday Things"
	/>
	<meta
		name="twitter:description"
		content="Discover unique art merchandise — prints, apparel, and accessories featuring original artwork."
	/>
</svelte:head>

<JsonLd schema={generateWebSiteJsonLd(data.baseUrl)} />

<div class="mx-auto max-w-7xl px-6 py-16">
	<div class="text-center">
		<h1 class="text-4xl font-bold tracking-tight text-text-primary sm:text-6xl">
			Art You Can Wear.<br />Places You Can Feel.
		</h1>
		<p class="mt-6 text-lg leading-8 text-text-secondary">
			Original artwork transformed into premium prints, apparel, and
			accessories. Every piece made to order, just for you.
		</p>
		<div class="mt-10 flex items-center justify-center gap-x-6">
			<a
				href="/shop"
				class="rounded-md bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-accent-hover"
			>
				Shop Now
			</a>
			<a
				href="/about"
				class="text-sm font-semibold leading-6 text-text-primary"
			>
				Learn More &rarr;
			</a>
		</div>
	</div>

	{#if data.featured.length > 0}
		<section class="mt-20">
			<h2 class="text-2xl font-bold tracking-tight text-text-primary">
				Featured
			</h2>
			<div
				class="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4"
			>
				{#each data.featured as product}
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

	{#if data.categories.length > 0}
		<section class="mt-20">
			<h2 class="text-2xl font-bold tracking-tight text-text-primary">
				Shop by Category
			</h2>
			<div
				class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
			>
				{#each data.categories as category}
					<a
						href="/shop/{category.slug}"
						class="group rounded-lg border border-border p-6 transition-colors hover:border-accent hover:bg-accent/10"
					>
						<h3
							class="text-lg font-semibold text-text-primary group-hover:text-accent"
						>
							{category.name}
						</h3>
						{#if category.description}
							<p class="mt-2 text-sm text-text-secondary">
								{category.description}
							</p>
						{/if}
						<p class="mt-2 text-sm text-text-muted">
							{category.productCount} products
						</p>
					</a>
				{/each}
			</div>
		</section>
	{/if}
</div>
