<script lang="ts">
	interface ProductCardProps {
		title: string;
		slug: string;
		basePrice: string;
		thumbnailUrl: string;
		categorySlug: string;
	}

	let { title, slug, basePrice, thumbnailUrl, categorySlug }: ProductCardProps = $props();

	const formattedPrice: string = $derived(`$${Number(basePrice).toFixed(2)}`);
</script>

<a href="/shop/{categorySlug}/{slug}" class="group block">
	<div class="aspect-square overflow-hidden rounded-lg bg-bg-tertiary">
		<img
			src={thumbnailUrl}
			alt={title}
			width="400"
			height="400"
			loading="lazy"
			decoding="async"
			class="h-full w-full object-cover transition-transform group-hover:scale-105"
		/>
	</div>
	<div class="mt-3">
		<h3 class="text-sm font-medium text-text-primary">{title}</h3>
		<p class="mt-1 text-sm text-text-secondary">{formattedPrice}</p>
	</div>
</a>
