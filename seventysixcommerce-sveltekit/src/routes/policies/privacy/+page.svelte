<script lang="ts">
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Privacy Policy — SeventySixCommerce</title>
	<meta
		name="description"
		content="SeventySixCommerce privacy policy — how we handle your data."
	/>
	<link rel="canonical" href={`${data.baseUrl}/policies/privacy`} />
	<meta property="og:title" content="Privacy Policy — SeventySixCommerce" />
	<meta
		property="og:description"
		content="SeventySixCommerce privacy policy — how we handle your data."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:url" content={`${data.baseUrl}/policies/privacy`} />
	<meta name="twitter:card" content="summary" />
</svelte:head>

<div class="mx-auto max-w-3xl px-6 py-16">
	<h1 class="text-3xl font-bold tracking-tight text-text-primary">
		Privacy Policy
	</h1>
	<div class="mt-8 space-y-6 text-text-secondary leading-relaxed">
		<p>Last updated: {new Date().getFullYear()}</p>

		<h2 class="text-xl font-semibold text-text-primary">
			Information We Collect
		</h2>
		<p>
			We collect only the information necessary to process your order:
			name, shipping address, and email address. Payment information is
			handled securely by Stripe — we never see or store your card
			details.
		</p>

		<h2 class="text-xl font-semibold text-text-primary">
			How We Use Your Information
		</h2>
		<p>
			Your information is used solely to fulfill your order and send
			shipping notifications. We do not sell, rent, or share your personal
			information with third parties for marketing purposes.
		</p>

		<h2 class="text-xl font-semibold text-text-primary">Cookies</h2>
		<p>
			We use a single HTTP-only session cookie to maintain your shopping
			cart. No tracking cookies or third-party analytics are used.
		</p>

		<h2 class="text-xl font-semibold text-text-primary">Contact</h2>
		<p>
			For privacy-related inquiries, please contact us at
			privacy@SeventySixCommerce.art.
		</p>
	</div>
</div>
