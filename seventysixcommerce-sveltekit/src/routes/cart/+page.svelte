<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import CartItem from '$lib/components/cart/CartItem.svelte';
	import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_DOLLARS } from '$lib/constants';

	let { data }: { data: PageData } = $props();

	const shippingCost: number = $derived(data.freeShipping ? 0 : STANDARD_SHIPPING_DOLLARS);
	const total: number = $derived(data.subtotal + shippingCost);
</script>

<svelte:head>
	<title>Shopping Cart | SeventySixCommerce</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-3xl px-6 py-16">
	<h1 class="text-3xl font-bold tracking-tight text-text-primary">Shopping Cart</h1>

	{#if data.cart.length === 0}
		<div class="mt-12 text-center">
			<p class="text-lg text-text-muted">Your cart is empty</p>
			<a
				href="/shop"
				class="mt-6 inline-block rounded-md bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-hover"
			>
				Browse our collection
			</a>
		</div>
	{:else}
		<div class="mt-8">
			{#each data.cart as item}
				<CartItem {item} />
			{/each}
		</div>

		<div class="mt-8 border-t border-border pt-6">
			<div class="flex justify-between text-sm text-text-secondary">
				<span>Subtotal</span>
				<span>${data.subtotal.toFixed(2)}</span>
			</div>
			<div class="mt-2 flex justify-between text-sm text-text-secondary">
				<span>Shipping</span>
				<span>
					{#if data.freeShipping}
						<span class="text-green-600">Free</span>
					{:else}
						${STANDARD_SHIPPING_DOLLARS}
					{/if}
				</span>
			</div>
			{#if !data.freeShipping}
				<p class="mt-1 text-xs text-text-muted">
					Free shipping on orders over ${FREE_SHIPPING_THRESHOLD}
				</p>
			{/if}
			<div class="mt-4 flex justify-between border-t border-border pt-4 text-base font-semibold text-text-primary">
				<span>Total</span>
				<span>${total.toFixed(2)}</span>
			</div>
		</div>

		<form method="POST" action="/checkout" use:enhance class="mt-8">
			<button
				type="submit"
				class="w-full rounded-md bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-accent-hover"
			>
				Proceed to Checkout
			</button>
		</form>
	{/if}
</div>
