<script lang="ts">
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>About — SeventySixCommerce</title>
	<meta
		name="description"
		content="Learn about SeventySixCommerce — art-inspired merchandise celebrating the places that matter to you."
	/>
	<link rel="canonical" href={`${data.baseUrl}/about`} />
	<meta property="og:title" content="About — SeventySixCommerce" />
	<meta
		property="og:description"
		content="Learn about SeventySixCommerce — art-inspired merchandise celebrating the places that matter to you."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:url" content={`${data.baseUrl}/about`} />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="About — SeventySixCommerce" />
	<meta
		name="twitter:description"
		content="Learn about SeventySixCommerce — art-inspired merchandise celebrating the places that matter to you."
	/>
</svelte:head>

<div class="mx-auto max-w-3xl px-6 py-16">
	<h1 class="text-3xl font-bold tracking-tight text-text-primary">
		About SeventySixCommerce
	</h1>
	<div class="mt-8 space-y-6 text-text-secondary leading-relaxed">
		<p>
			SeventySixCommerce transforms original artwork into premium merchandise —
			prints, apparel, and accessories that celebrate the places and
			moments that matter to you.
		</p>
		<p>
			Each piece starts as an original work of art, carefully curated and
			reproduced on high-quality products through our print-on-demand
			partnership with Printful. This means every item is made to order —
			reducing waste and ensuring the highest quality.
		</p>
		<p>
			We believe art should be accessible and personal. Whether it's a
			canvas print for your wall or a t-shirt that sparks a conversation,
			our goal is to help you carry a piece of art with you wherever you
			go.
		</p>
	</div>
</div>
