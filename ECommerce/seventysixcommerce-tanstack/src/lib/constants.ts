/**
 * Application-wide constants for SeventySixCommerce TanStack.
 * Shared constants come from @seventysixcommerce/shared/constants.
 * This file re-exports them and adds app-specific constants.
 */
// ── Shared constants (re-exported) ────────────────────────────────────
export { BRAND_NAME, CART_SESSION_COOKIE, CART_SESSION_MAX_AGE_SECONDS, FREE_SHIPPING_THRESHOLD, PLACEHOLDER_CACHE_MAX_AGE, PLACEHOLDER_DEFAULT_SIZE, PLACEHOLDER_MAX_SIZE, PLACEHOLDER_MIN_SIZE, STANDARD_SHIPPING_DOLLARS } from "@seventysixcommerce/shared/constants";

// ── App-specific constants ────────────────────────────────────────────

/** Canonical public URL for the TanStack SeventySixCommerce site. */
export const SITE_URL: string = "https://commerce-tanstack.seventysixsandbox.com";

/** Cookie name for persisting the user's theme preference so SSR can match. */
export const THEME_COOKIE_NAME: string = "ssxc-theme";

/** Max-age for the theme cookie in seconds (1 year). */
export const THEME_COOKIE_MAX_AGE: number = 31_536_000;