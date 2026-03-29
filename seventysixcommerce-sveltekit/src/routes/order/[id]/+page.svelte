<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const statusLabels: Record<string, string> = {
		paid: 'Payment Received',
		fulfilling: 'Being Prepared',
		shipped: 'Shipped',
		delivered: 'Delivered',
		cancelled: 'Cancelled',
		fulfillment_error: 'Processing Issue',
	};
</script>

<svelte:head>
	<title>Order {data.order.id.slice(0, 8)} — SeventySixCommerce</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-16">
	<h1 class="mb-6 text-2xl font-bold">Order Details</h1>

	<div class="mb-8 rounded-lg border p-6">
		<div class="mb-4 flex items-center justify-between">
			<span class="text-sm text-text-muted">Order ID</span>
			<span class="font-mono text-sm">{data.order.id.slice(0, 8)}</span>
		</div>
		<div class="mb-4 flex items-center justify-between">
			<span class="text-sm text-text-muted">Status</span>
			<span class="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
				{statusLabels[data.order.status] ?? data.order.status}
			</span>
		</div>
		{#if data.order.trackingUrl}
			<div class="flex items-center justify-between">
				<span class="text-sm text-text-muted">Tracking</span>
				<a
					href={data.order.trackingUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="text-blue-600 underline hover:text-blue-800"
				>
					Track Package
				</a>
			</div>
		{/if}
	</div>

	<div class="rounded-lg border p-6">
		<h2 class="mb-4 text-lg font-semibold">Items</h2>
		<div class="divide-y">
			{#each data.items as item}
				<div class="flex justify-between py-3">
					<div>
						<p class="font-medium">{item.productTitle}</p>
						<p class="text-sm text-text-muted">Qty: {item.quantity}</p>
					</div>
					<p class="font-medium">${(Number(item.unitPrice) * item.quantity).toFixed(2)}</p>
				</div>
			{/each}
		</div>
		<div class="mt-4 border-t pt-4">
			<div class="flex justify-between text-lg font-bold">
				<span>Total</span>
				<span>${Number(data.order.totalAmount).toFixed(2)}</span>
			</div>
		</div>
	</div>

	<div class="mt-8 text-center">
		<a href="/shop" class="text-blue-600 underline hover:text-blue-800"> Continue Shopping </a>
	</div>
</div>
