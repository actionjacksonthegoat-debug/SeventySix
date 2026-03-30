<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Order Confirmed — SeventySixCommerce</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-16">
	<div class="text-center">
		<div class="mb-6 text-5xl">✓</div>
		<h1 class="mb-4 text-3xl font-bold">Thank you for your order!</h1>
		<p class="mb-8 text-text-secondary">
			A confirmation email has been sent to <strong>{data.email}</strong>.
		</p>
	</div>

	<div class="rounded-lg border p-6">
		<h2 class="mb-4 text-lg font-semibold">Order Summary</h2>

		<div class="divide-y">
			{#each data.items as item}
				<div class="flex justify-between py-3">
					<div>
						<p class="font-medium">{item.name}</p>
						<p class="text-sm text-text-muted">Qty: {item.quantity}</p>
					</div>
					<p class="font-medium">${item.amount.toFixed(2)}</p>
				</div>
			{/each}
		</div>

		<div class="mt-4 border-t pt-4">
			<div class="flex justify-between text-lg font-bold">
				<span>Total</span>
				<span>${data.total.toFixed(2)}</span>
			</div>
		</div>
	</div>

	<div class="mt-8 text-center">
		<a href="/shop" class="text-blue-600 underline hover:text-blue-800">
			Continue Shopping
		</a>
	</div>
</div>
