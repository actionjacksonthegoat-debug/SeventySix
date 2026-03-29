/**
 * Typed GA4 ecommerce event helpers.
 * All functions are no-ops if analytics is not active.
 */
import { isAnalyticsActive } from "./analytics";

/** GA4 ecommerce item shape. */
export interface Ga4Item
{
	/** Product or variant ID. */
	item_id: string;
	/** Product name. */
	item_name: string;
	/** Category name. */
	item_category?: string;
	/** Unit price in dollars. */
	price?: number;
	/** Quantity. */
	quantity?: number;
}

/**
 * Sends a view_item_list event (product listing page).
 *
 * @param {string} listName - The name of the product list (e.g., "T-Shirts").
 * @param {Ga4Item[]} items - The products displayed.
 */
export function trackViewItemList(listName: string, items: Ga4Item[]): void
{
	if (!isAnalyticsActive() || typeof window === "undefined")
	{
		return;
	}

	window.gtag("event", "view_item_list",
		{
			item_list_name: listName,
			items
		});
}

/**
 * Sends a select_item event (product click from list).
 *
 * @param {string} listName - The list the product was selected from.
 * @param {Ga4Item} item - The selected product.
 */
export function trackSelectItem(listName: string, item: Ga4Item): void
{
	if (!isAnalyticsActive() || typeof window === "undefined")
	{
		return;
	}

	window.gtag("event", "select_item",
		{
			item_list_name: listName,
			items: [item]
		});
}

/**
 * Sends a view_item event (product detail page).
 *
 * @param {Ga4Item} item - The viewed product.
 */
export function trackViewItem(item: Ga4Item): void
{
	if (!isAnalyticsActive() || typeof window === "undefined")
	{
		return;
	}

	window.gtag("event", "view_item",
		{
			items: [item]
		});
}

/**
 * Sends an add_to_cart event.
 *
 * @param {Ga4Item} item - The product added to cart.
 * @param {number} value - Cart value in dollars.
 */
export function trackAddToCart(item: Ga4Item, value: number): void
{
	if (!isAnalyticsActive() || typeof window === "undefined")
	{
		return;
	}

	window.gtag("event", "add_to_cart",
		{
			currency: "USD",
			value,
			items: [item]
		});
}

/**
 * Sends a remove_from_cart event.
 *
 * @param {Ga4Item} item - The product removed from cart.
 * @param {number} value - Removed value in dollars.
 */
export function trackRemoveFromCart(item: Ga4Item, value: number): void
{
	if (!isAnalyticsActive() || typeof window === "undefined")
	{
		return;
	}

	window.gtag("event", "remove_from_cart",
		{
			currency: "USD",
			value,
			items: [item]
		});
}

/**
 * Sends a begin_checkout event.
 *
 * @param {Ga4Item[]} items - Cart items.
 * @param {number} value - Total cart value in dollars.
 */
export function trackBeginCheckout(items: Ga4Item[], value: number): void
{
	if (!isAnalyticsActive() || typeof window === "undefined")
	{
		return;
	}

	window.gtag("event", "begin_checkout",
		{
			currency: "USD",
			value,
			items
		});
}

/**
 * Sends a purchase event.
 *
 * @param {string} transactionId - The order/transaction ID.
 * @param {number} value - Total order value in dollars.
 * @param {Ga4Item[]} items - Purchased items.
 */
export function trackPurchase(transactionId: string, value: number, items: Ga4Item[]): void
{
	if (!isAnalyticsActive() || typeof window === "undefined")
	{
		return;
	}

	window.gtag("event", "purchase",
		{
			transaction_id: transactionId,
			currency: "USD",
			value,
			items
		});
}

/**
 * Sends a search event.
 *
 * @param {string} searchTerm - The search query.
 */
export function trackSearch(searchTerm: string): void
{
	if (!isAnalyticsActive() || typeof window === "undefined")
	{
		return;
	}

	window.gtag("event", "search",
		{
			search_term: searchTerm
		});
}