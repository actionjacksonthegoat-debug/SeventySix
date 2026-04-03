<script lang="ts">
	import { getConsentState, setConsentState, revokeConsent, type ConsentState } from "$lib/analytics/consent";
	import { initAnalytics, resetAnalytics } from "$lib/analytics/analytics";

	interface Props
	{
		/** GA4 measurement ID (e.g., "G-XXXXXXXXXX"). */
		measurementId: string;
	}

	const { measurementId }: Props = $props();

	let visible: boolean = $state(false);
	let currentState: ConsentState = $state("pending");

	$effect(
		() =>
		{
			currentState = getConsentState();

			if (currentState === "pending")
			{
				visible = true;
			}
			else if (currentState === "granted")
			{
				initAnalytics(measurementId);
			}
		}
	);

	/** Handles the user accepting analytics tracking. */
	function handleAccept(): void
	{
		setConsentState("granted");
		initAnalytics(measurementId);
		currentState = "granted";
		visible = false;
	}

	/** Handles the user declining analytics tracking. */
	function handleDecline(): void
	{
		revokeConsent();
		resetAnalytics();
		currentState = "denied";
		visible = false;
	}
</script>

{#if visible}
	<div
		role="dialog"
		aria-label="Cookie consent"
		class="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-bg-secondary p-4 shadow-lg"
	>
		<div class="mx-auto flex max-w-7xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
			<p class="text-sm text-text-secondary">
				We use cookies for analytics to improve your experience.
				See our <a href="/policies/privacy" class="underline hover:text-text-primary">Privacy Policy</a>.
			</p>
			<div class="flex gap-3">
				<button
					type="button"
					onclick={handleDecline}
					class="rounded-md border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary"
				>
					Decline
				</button>
				<button
					type="button"
					onclick={handleAccept}
					class="rounded-md bg-accent px-4 py-2 text-sm text-white transition-colors hover:bg-accent/90"
				>
					Accept
				</button>
			</div>
		</div>
	</div>
{/if}