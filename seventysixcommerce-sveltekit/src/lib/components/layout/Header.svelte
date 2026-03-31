<script lang="ts">
	import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';

	let { cartCount = 0 }: { cartCount?: number } = $props();
</script>

<header class="border-b border-border bg-bg-primary">
	<nav class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
		<a href="/" class="text-xl font-bold tracking-tight text-text-primary">SeventySixCommerce</a>

		<div class="flex items-center gap-6">
			<a href="/shop" class="text-sm font-medium text-text-secondary hover:text-text-primary">Shop</a>
			<a href="/about" class="text-sm font-medium text-text-secondary hover:text-text-primary">About</a>
			<a href="/cart" class="relative text-sm font-medium text-text-secondary hover:text-text-primary">
				Cart
				{#if cartCount > 0}
					<span class="absolute -top-2 -right-3 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-white">
						{cartCount}
					</span>
				{/if}
			</a>
			<ThemeToggle />
		</div>
	</nav>
</header>
