/**
 * Analytics barrel export.
 * Re-exports consent management, GA4 core, and ecommerce event tracking.
 */
export {
	CONSENT_COOKIE_MAX_AGE,
	CONSENT_COOKIE_NAME,
	type ConsentState,
	getConsentState,
	revokeConsent,
	setConsentState
} from "./consent";

export {
	initAnalytics,
	isAnalyticsActive,
	resetAnalytics,
	trackPageView
} from "./analytics";

export {
	type Ga4Item,
	trackAddToCart,
	trackBeginCheckout,
	trackPurchase,
	trackRemoveFromCart,
	trackSearch,
	trackSelectItem,
	trackViewItem,
	trackViewItemList
} from "./ecommerce-events";