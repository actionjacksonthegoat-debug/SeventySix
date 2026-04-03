export { initAnalytics, isAnalyticsActive, resetAnalytics, trackPageView } from "./analytics";
export {
	CONSENT_COOKIE_MAX_AGE,
	CONSENT_COOKIE_NAME,
	getConsentState,
	revokeConsent,
	setConsentState
} from "./consent";
export type { ConsentState } from "./consent";
export {
	trackAddToCart,
	trackBeginCheckout,
	trackPurchase,
	trackRemoveFromCart,
	trackSearch,
	trackSelectItem,
	trackViewItem,
	trackViewItemList
} from "./ecommerce-events";
export type { Ga4Item } from "./ecommerce-events";