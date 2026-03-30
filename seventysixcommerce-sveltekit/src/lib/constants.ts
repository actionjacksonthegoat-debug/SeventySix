/**
 * Application-wide constants for SeventySixCommerce SvelteKit.
 * Centralizes magic numbers and strings to prevent duplication and drift.
 */

/** Brand display name used in SEO and UI. */
export const BRAND_NAME: string = "SeventySixCommerce";

// ── Cart ──────────────────────────────────────────────────────────────

/** Maximum quantity per cart line item. */
export const MAX_CART_ITEM_QUANTITY: number = 10;

/** Cart session cookie name. */
export const CART_SESSION_COOKIE: string = "cart_session";

/** Cart session max age in seconds (30 days). */
export const CART_SESSION_MAX_AGE_SECONDS: number =
	60 * 60 * 24 * 30;

/** Cart expiry in days. */
export const CART_EXPIRY_DAYS: number = 30;

// ── Shipping ──────────────────────────────────────────────────────────

/** Subtotal threshold for free shipping, in dollars. */
export const FREE_SHIPPING_THRESHOLD: number = 60;

/** Standard shipping cost in cents (for Stripe). */
export const STANDARD_SHIPPING_CENTS: number = 599;

/** Standard shipping cost in dollars (for display). */
export const STANDARD_SHIPPING_DOLLARS: number = 5.99;

// ── Conversion ────────────────────────────────────────────────────────

/** Dollar-to-cents multiplier for Stripe amounts. */
export const CENTS_PER_DOLLAR: number = 100;

// ── Pagination ────────────────────────────────────────────────────────

/** Maximum products per page. */
export const MAX_PAGE_SIZE: number = 50;

/** Default products per page. */
export const DEFAULT_PAGE_SIZE: number = 24;

/** Number of related products to show on product detail pages. */
export const RELATED_PRODUCTS_LIMIT: number = 4;

// ── Caching ───────────────────────────────────────────────────────────

/** Sitemap cache TTL in seconds (1 hour). */
export const SITEMAP_CACHE_MAX_AGE: number = 3600;

/** Placeholder image cache TTL in seconds (24 hours). */
export const PLACEHOLDER_CACHE_MAX_AGE: number = 86400;

// ── Placeholder Dimensions ────────────────────────────────────────────

/** Default placeholder dimension in pixels. */
export const PLACEHOLDER_DEFAULT_SIZE: number = 600;

/** Minimum placeholder dimension in pixels. */
export const PLACEHOLDER_MIN_SIZE: number = 1;

/** Maximum placeholder dimension in pixels. */
export const PLACEHOLDER_MAX_SIZE: number = 2000;

// ── Integrations ──────────────────────────────────────────────────────

/** Default country code for fulfillment. */
export const DEFAULT_COUNTRY: string = "US";

/** Brevo transactional email API endpoint. */
export const BREVO_API_URL: string = "https://api.brevo.com/v3/smtp/email";

// ── Mock ──────────────────────────────────────────────────────────────

/** Email address used for mock checkout orders. */
export const MOCK_ORDER_EMAIL: string = "mock@example.com";