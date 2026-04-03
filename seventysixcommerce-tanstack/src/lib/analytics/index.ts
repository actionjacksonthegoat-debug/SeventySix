/**
 * Analytics barrel export.
 * Re-exports all analytics utilities from the shared commerce package.
 * @see {@link @seventysixcommerce/shared/analytics}
 */
export {
	CONSENT_COOKIE_MAX_AGE,
	CONSENT_COOKIE_NAME,
	type ConsentState,
	type Ga4Item,
	getConsentState,
	initAnalytics,
	isAnalyticsActive,
	resetAnalytics,
	revokeConsent,
	setConsentState,
	trackAddToCart,
	trackBeginCheckout,
	trackPageView,
	trackPurchase,
	trackRemoveFromCart,
	trackSearch,
	trackSelectItem,
	trackViewItem,
	trackViewItemList
} from "@seventysixcommerce/shared/analytics";