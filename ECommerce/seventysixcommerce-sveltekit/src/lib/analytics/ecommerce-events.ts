/**
 * Re-exports GA4 ecommerce event helpers from the shared commerce package.
 * @see {@link @seventysixcommerce/shared/analytics}
 */
export {
	trackAddToCart,
	trackBeginCheckout,
	trackPurchase,
	trackRemoveFromCart,
	trackSearch,
	trackSelectItem,
	trackViewItem,
	trackViewItemList
} from "@seventysixcommerce/shared/analytics";

export type { Ga4Item } from "@seventysixcommerce/shared/analytics";