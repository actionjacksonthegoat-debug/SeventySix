import { metrics } from "@opentelemetry/api";
import type { Counter, Histogram, Meter } from "@opentelemetry/api";

/** The meter instance for commerce metrics. */
const meter: Meter =
	metrics.getMeter("seventysixcommerce-tanstack");

/** Tracks page views by page type (home, shop, product, cart, checkout). */
const pageViewCounter: Counter =
	meter.createCounter("commerce.page.view",
		{ description: "Page views by page type" });

/** Tracks cart addition events by product slug. */
const cartAddCounter: Counter =
	meter.createCounter("commerce.cart.add",
		{ description: "Cart add events" });

/** Tracks cart removal events by product slug. */
const cartRemoveCounter: Counter =
	meter.createCounter("commerce.cart.remove",
		{ description: "Cart remove events" });

/** Tracks checkout initiation events. */
const checkoutStartCounter: Counter =
	meter.createCounter("commerce.checkout.start",
		{
			description: "Checkout start events"
		});

/** Tracks successful checkout completion events. */
const checkoutCompleteCounter: Counter =
	meter.createCounter("commerce.checkout.complete",
		{
			description: "Checkout complete events"
		});

/** Tracks the duration of checkout flows in milliseconds. */
const checkoutDurationHistogram: Histogram =
	meter.createHistogram("commerce.checkout.duration_ms",
		{
			description: "Checkout flow duration in milliseconds",
			unit: "ms"
		});

/**
 * Records a page view event for the given page type.
 * @param pageType The type of page viewed (e.g., "home", "shop", "product", "cart", "checkout").
 */
export function recordPageView(pageType: string): void
{
	pageViewCounter.add(1,
		{ "page.type": pageType });
}

/**
 * Records a cart addition event for the given product.
 * @param productSlug The slug identifier of the product added to cart.
 */
export function recordCartAdd(productSlug: string): void
{
	cartAddCounter.add(1,
		{ "product.slug": productSlug });
}

/**
 * Records a cart removal event for the given product.
 * @param productSlug The slug identifier of the product removed from cart.
 */
export function recordCartRemove(productSlug: string): void
{
	cartRemoveCounter.add(1,
		{ "product.slug": productSlug });
}

/** Records a checkout initiation event. */
export function recordCheckoutStart(): void
{
	checkoutStartCounter.add(1);
}

/**
 * Records a checkout completion event with duration.
 * @param durationMs The duration of the checkout flow in milliseconds.
 */
export function recordCheckoutComplete(durationMs: number): void
{
	checkoutCompleteCounter.add(1);
	checkoutDurationHistogram.record(durationMs,
		{ "checkout.status": "complete" });
}