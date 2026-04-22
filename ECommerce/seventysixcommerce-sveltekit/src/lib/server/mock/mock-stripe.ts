/**
 * Re-exports mock Stripe from the shared library.
 * @deprecated Import directly from "@seventysixcommerce/shared/stripe" instead.
 */
export { _clearMockSessions, createMockStripe } from "@seventysixcommerce/shared/stripe";
export type { MockSession, MockStripeClient } from "@seventysixcommerce/shared/stripe";