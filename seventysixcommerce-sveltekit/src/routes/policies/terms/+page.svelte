<script lang="ts">
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Terms of Service — SeventySixCommerce</title>
	<meta name="description" content="SeventySixCommerce terms of service." />
	<link rel="canonical" href={`${data.baseUrl}/policies/terms`} />
	<meta property="og:title" content="Terms of Service — SeventySixCommerce" />
	<meta property="og:description" content="SeventySixCommerce terms of service." />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={`${data.baseUrl}/policies/terms`} />
	<meta name="twitter:card" content="summary" />
</svelte:head>

<div class="mx-auto max-w-3xl px-6 py-16">
	<h1 class="text-3xl font-bold tracking-tight text-text-primary">
		Terms of Service
	</h1>
	<div class="mt-8 space-y-6 text-text-secondary leading-relaxed">
		<p>Last updated: {new Date().getFullYear()}</p>

		<h2 class="text-xl font-semibold text-text-primary">Agreement</h2>
		<p>
			By using SeventySixCommerce, you agree to these terms. If you do not agree,
			please do not use our services.
		</p>

		<h2 class="text-xl font-semibold text-text-primary">Products</h2>
		<p>
			All products are made to order through our print-on-demand service.
			Colors may vary slightly from screen display. We strive for accuracy
			in all product descriptions and images.
		</p>

		<h2 class="text-xl font-semibold text-text-primary">Pricing</h2>
		<p>
			All prices are listed in USD. We reserve the right to modify prices
			at any time. Orders are charged at the price displayed at the time
			of purchase.
		</p>

		<h2 class="text-xl font-semibold text-text-primary">
			Intellectual Property
		</h2>
		<p>
			All artwork and designs are the property of SeventySixCommerce and its
			artists. Reproduction without written permission is prohibited.
		</p>
	</div>
</div>
