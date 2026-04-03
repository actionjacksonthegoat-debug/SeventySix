import { metrics } from "@opentelemetry/api";
import type { Counter, Histogram, Meter } from "@opentelemetry/api";

/** The public API surface of a commerce metrics instance. */
export interface CommerceMetrics
{
	/** Records a page view event. */
	recordPageView: (pageType: string) => void;
	/** Records a cart addition event. */
	recordCartAdd: (productSlug: string) => void;
	/** Records a cart removal event. */
	recordCartRemove: (productSlug: string) => void;
	/** Records a checkout initiation event. */
	recordCheckoutStart: () => void;
	/** Records a checkout completion event with duration. */
	recordCheckoutComplete: (durationMs: number) => void;
}

/**
 * Creates a commerce metrics instance scoped to the given meter name.
 * Each instance creates its own OTel Counter and Histogram instruments.
 *
 * @param {string} meterName - The OTel meter name (e.g., "seventysixcommerce-sveltekit").
 * @returns {CommerceMetrics} A commerce metrics instance.
 */
export function createCommerceMetrics(meterName: string): CommerceMetrics
{
	const meter: Meter =
		metrics.getMeter(meterName);

	const pageViewCounter: Counter =
		meter.createCounter("commerce.page.view",
			{
				description: "Page views by page type"
			});

	const cartAddCounter: Counter =
		meter.createCounter("commerce.cart.add",
			{ description: "Cart add events" });

	const cartRemoveCounter: Counter =
		meter.createCounter("commerce.cart.remove",
			{
				description: "Cart remove events"
			});

	const checkoutStartCounter: Counter =
		meter.createCounter("commerce.checkout.start",
			{
				description: "Checkout start events"
			});

	const checkoutCompleteCounter: Counter =
		meter.createCounter("commerce.checkout.complete",
			{
				description: "Checkout complete events"
			});

	const checkoutDurationHistogram: Histogram =
		meter.createHistogram("commerce.checkout.duration_ms",
			{
				description: "Checkout flow duration in milliseconds",
				unit: "ms"
			});

	return {
		recordPageView(pageType: string): void
		{
			pageViewCounter.add(1,
				{ "page.type": pageType });
		},

		recordCartAdd(productSlug: string): void
		{
			cartAddCounter.add(1,
				{ "product.slug": productSlug });
		},

		recordCartRemove(productSlug: string): void
		{
			cartRemoveCounter.add(1,
				{ "product.slug": productSlug });
		},

		recordCheckoutStart(): void
		{
			checkoutStartCounter.add(1);
		},

		recordCheckoutComplete(durationMs: number): void
		{
			checkoutCompleteCounter.add(1);
			checkoutDurationHistogram.record(durationMs,
				{ "checkout.status": "complete" });
		}
	};
}