/**
 * Analytics barrel export.
 * Re-exports all analytics utilities from the shared commerce package.
 * @see {@link @seventysixcommerce/shared/analytics}
 */
export { type ConsentState, type Ga4Item, getConsentState, initAnalytics, resetAnalytics, revokeConsent, setConsentState, trackPageView } from "@seventysixcommerce/shared/analytics";