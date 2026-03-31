<script lang="ts">
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Shop — SeventySixCommerce</title>
	<meta
		name="description"
		content="Browse all SeventySixCommerce art merchandise categories."
	/>
	<link rel="canonical" href={`${data.baseUrl}/shop`} />
	<meta property="og:title" content="Shop — SeventySixCommerce" />
	<meta
		property="og:description"
		content="Browse all SeventySixCommerce art merchandise categories."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:url" content={`${data.baseUrl}/shop`} />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="Shop — SeventySixCommerce" />
	<meta
		name="twitter:description"
		content="Browse all SeventySixCommerce art merchandise categories."
	/>
</svelte:head>

<div class="mx-auto max-w-7xl px-6 py-16">
	<h1 class="text-3xl font-bold tracking-tight text-text-primary">Shop</h1>

	<div class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.categories as category}
			<a
				href="/shop/{category.slug}"
				class="group rounded-lg border border-border p-6 transition-colors hover:border-accent hover:bg-accent/10"
			>
				<h2
					class="text-lg font-semibold text-text-primary group-hover:text-accent"
				>
					{category.name}
				</h2>
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
</div>
