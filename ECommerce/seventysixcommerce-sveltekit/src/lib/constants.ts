/**
 * Application-wide constants for SeventySixCommerce SvelteKit.
 * Shared constants come from @seventysixcommerce/shared/constants.
 * This file re-exports them and adds app-specific constants.
 */

// ── Shared constants (re-exported) ────────────────────────────────────

export {
	BRAND_NAME,
	BREVO_API_URL,
	CART_SESSION_COOKIE,
	CART_SESSION_MAX_AGE_SECONDS,
	CENTS_PER_DOLLAR,
	DEFAULT_COUNTRY,
	DEFAULT_PAGE_SIZE,
	FREE_SHIPPING_THRESHOLD,
	MAX_CART_ITEM_QUANTITY,
	MAX_PAGE_SIZE,
	MOCK_ORDER_EMAIL,
	PLACEHOLDER_CACHE_MAX_AGE,
	PLACEHOLDER_DEFAULT_SIZE,
	PLACEHOLDER_MAX_SIZE,
	PLACEHOLDER_MIN_SIZE,
	PRINTFUL_API_BASE_URL,
	RELATED_PRODUCTS_LIMIT,
	STANDARD_SHIPPING_CENTS,
	STANDARD_SHIPPING_DOLLARS
} from "@seventysixcommerce/shared/constants";

// ── App-specific constants ────────────────────────────────────────────

/** Cart expiry in days. */
export const CART_EXPIRY_DAYS: number = 30;

/** Sitemap cache TTL in seconds (1 hour). */
export const SITEMAP_CACHE_MAX_AGE: number = 3600;