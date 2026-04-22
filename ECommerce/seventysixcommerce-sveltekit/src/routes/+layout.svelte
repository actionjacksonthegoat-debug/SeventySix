<script lang="ts">
	import "../app.css";
	import Header from "$lib/components/layout/Header.svelte";
	import Footer from "$lib/components/layout/Footer.svelte";
	import CookieConsent from "$lib/components/ui/CookieConsent.svelte";
	import {
		initClientTelemetry,
		recordNavigation,
	} from "$lib/telemetry-client";
	import { trackPageView } from "$lib/analytics";
	import { initTheme } from "$lib/stores/theme";
	import { afterNavigate } from "$app/navigation";
	import { isPresent } from "@seventysixcommerce/shared/utils";
	import { browser } from "$app/environment";
	import { onMount } from "svelte";

	let { children, data } = $props();

	onMount(() => {
		initTheme();
		if (browser) {
			initClientTelemetry(data.otelEndpoint);
		}
	});

	afterNavigate(({ to }) => {
		if (isPresent(to?.url)) {
			recordNavigation(to.url.pathname);
			trackPageView(to.url.pathname, document.title);
		}
	});
</script>

<svelte:head>
	<meta
		name="description"
		content="SeventySixCommerce — Art-inspired merchandise"
	/>
	{#if data.googleSiteVerification.length > 0}
		<meta name="google-site-verification" content={data.googleSiteVerification} />
	{/if}
	{#if data.bingSiteVerification.length > 0}
		<meta name="msvalidate.01" content={data.bingSiteVerification} />
	{/if}
</svelte:head>

<div class="flex min-h-screen flex-col bg-bg-primary text-text-primary">
	{#if data.mockMode}
		<div
			class="bg-amber-500 text-center py-1 text-sm font-medium text-amber-950"
		>
			Demo Mode — No real transactions are processed
		</div>
	{/if}
	<Header cartCount={data.cartCount} />
	<main class="flex-1">
		{@render children()}
	</main>
	<Footer />
	{#if data.ga4MeasurementId.length > 0}
		<CookieConsent measurementId={data.ga4MeasurementId} />
	{/if}
</div>
