<script lang="ts">
	import { currentYear } from "$lib/utils/date";
</script>

<footer class="border-t border-border bg-bg-secondary">
	<div class="mx-auto max-w-7xl px-6 py-8">
		<div
			class="flex flex-col items-center justify-between gap-4 sm:flex-row"
		>
			<p class="text-sm text-text-muted">
				&copy; {currentYear()} SeventySixCommerce. All rights reserved.
			</p>
			<nav class="flex gap-6">
				<a
					href="/policies/privacy"
					class="text-sm text-text-muted hover:text-text-secondary"
					>Privacy</a
				>
				<a
					href="/policies/terms"
					class="text-sm text-text-muted hover:text-text-secondary"
					>Terms</a
				>
				<a
					href="/policies/returns"
					class="text-sm text-text-muted hover:text-text-secondary"
					>Returns</a
				>
			</nav>
		</div>
	</div>
</footer>
