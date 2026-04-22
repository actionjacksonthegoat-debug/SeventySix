<script lang="ts">
	import { enhance } from "$app/forms";
	import { MAX_CART_ITEM_QUANTITY } from "$lib/constants";
	import type { CartItem as CartItemType } from "@seventysixcommerce/shared/cart";

	let { item }: { item: CartItemType } = $props();
</script>

<div class="flex items-center gap-4 border-b border-border py-4">
	<div class="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-bg-tertiary">
		<img
			src={item.thumbnailUrl}
			alt={item.productTitle}
			width="80"
			height="80"
			loading="lazy"
			decoding="async"
			class="h-full w-full object-cover"
		/>
	</div>

	<div class="flex-1">
		<h3 class="text-sm font-medium text-text-primary">{item.productTitle}</h3>
		<p class="mt-1 text-sm text-text-muted">{item.variantName}</p>
		<p class="mt-1 text-sm text-text-secondary">
			${Number(item.unitPrice).toFixed(2)} each
		</p>
	</div>

	<div class="flex items-center gap-2">
		<form method="POST" action="?/updateQuantity" use:enhance>
			<input type="hidden" name="cartItemId" value={item.id} />
			<button
				type="submit"
				name="quantity"
				value={item.quantity - 1}
				class="flex h-8 w-8 items-center justify-center rounded border border-border text-sm hover:bg-bg-secondary"
				aria-label="Decrease quantity"
			>
				&minus;
			</button>
		</form>

		<span class="w-8 text-center text-sm">{item.quantity}</span>

		<form method="POST" action="?/updateQuantity" use:enhance>
			<input type="hidden" name="cartItemId" value={item.id} />
			<button
				type="submit"
				name="quantity"
				value={item.quantity + 1}
				class="flex h-8 w-8 items-center justify-center rounded border border-border text-sm hover:bg-bg-secondary"
				disabled={item.quantity >= MAX_CART_ITEM_QUANTITY}
				aria-label="Increase quantity"
			>
				+
			</button>
		</form>
	</div>

	<p class="w-20 text-right text-sm font-medium text-text-primary">${item.lineTotal}</p>

	<form method="POST" action="?/removeItem" use:enhance>
		<input type="hidden" name="cartItemId" value={item.id} />
		<button
			type="submit"
			class="text-sm text-red-600 hover:text-red-800"
			aria-label="Remove {item.productTitle} from cart"
		>
			Remove
		</button>
	</form>
</div>
