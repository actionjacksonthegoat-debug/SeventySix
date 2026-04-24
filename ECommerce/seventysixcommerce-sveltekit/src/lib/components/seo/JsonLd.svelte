<!--
  @component
  Renders JSON-LD structured data in a script tag for SEO.
  Escapes closing script tags to prevent XSS injection.
-->
<script lang="ts">
	let { schema }: { schema: Record<string, unknown> } = $props();

	/** Safely serializes JSON-LD, escaping sequences that could break out of script tags. */
	function safeJsonLd(data: Record<string, unknown>): string {
		return JSON.stringify(data).replace(/</g, "\\u003c");
	}
</script>

<svelte:head>
	{@html '<script type="application/ld+json">' + safeJsonLd(schema) + '</script>'}
</svelte:head>
