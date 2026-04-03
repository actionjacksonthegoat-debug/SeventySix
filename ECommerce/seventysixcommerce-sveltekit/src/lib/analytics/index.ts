export { initAnalytics, isAnalyticsActive, resetAnalytics, trackPageView } from "@seventysixcommerce/shared/analytics";
export { getConsentState, revokeConsent, setConsentState } from "@seventysixcommerce/shared/analytics";
export type { ConsentState } from "@seventysixcommerce/shared/analytics";
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