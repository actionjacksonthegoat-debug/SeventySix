<script lang="ts">
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Returns &amp; Exchanges — SeventySixCommerce</title>
	<meta
		name="description"
		content="SeventySixCommerce returns and exchange policy."
	/>
	<link rel="canonical" href={`${data.baseUrl}/policies/returns`} />
	<meta property="og:title" content="Returns & Exchanges — SeventySixCommerce" />
	<meta
		property="og:description"
		content="SeventySixCommerce returns and exchange policy."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:url" content={`${data.baseUrl}/policies/returns`} />
	<meta name="twitter:card" content="summary" />
</svelte:head>

<div class="mx-auto max-w-3xl px-6 py-16">
	<h1 class="text-3xl font-bold tracking-tight text-text-primary">
		Returns &amp; Exchanges
	</h1>
	<div class="mt-8 space-y-6 text-text-secondary leading-relaxed">
		<p>Last updated: {new Date().getFullYear()}</p>

		<h2 class="text-xl font-semibold text-text-primary">
			Made-to-Order Products
		</h2>
		<p>
			Because all products are made to order, we cannot accept returns for
			change of mind. However, we stand behind the quality of our
			products.
		</p>

		<h2 class="text-xl font-semibold text-text-primary">
			Defective or Damaged Items
		</h2>
		<p>
			If you receive a defective or damaged item, contact us within 14
			days of delivery. We will arrange a replacement or full refund at no
			additional cost to you.
		</p>

		<h2 class="text-xl font-semibold text-text-primary">Wrong Item</h2>
		<p>
			If you receive the wrong item, contact us immediately. We will send
			the correct item and provide a prepaid return label for the
			incorrect one.
		</p>

		<h2 class="text-xl font-semibold text-text-primary">Contact</h2>
		<p>
			For returns or exchanges, email us at support@SeventySixCommerce.art with
			your order number and a description of the issue.
		</p>
	</div>
</div>
