/** Canonical public URL for the TanStack SeventySixCommerce site. */
export const SITE_URL: string = "https://commerce-tanstack.seventysixsandbox.com";

/** Brand display name used in meta tags and JSON-LD. */
export const BRAND_NAME: string = "SeventySixCommerce";

/** Shipping threshold in dollars — orders at or above this ship free. */
export const FREE_SHIPPING_THRESHOLD: number = 60;

/** Standard shipping cost in cents (Stripe uses cents). */
export const STANDARD_SHIPPING_CENTS: number = 599;

/** Standard shipping cost in dollars (display). */
export const STANDARD_SHIPPING_DOLLARS: number = 5.99;

/** Maximum quantity per cart item. */
export const MAX_CART_ITEM_QUANTITY: number = 10;

/** Cart session cookie name. */
export const CART_COOKIE_NAME: string = "cart_session";

/** Cart session max age in seconds (30 days). */
export const CART_SESSION_MAX_AGE_SECONDS: number =
	30 * 24 * 60 * 60;

/** Default size for placeholder SVG images (pixels). */
export const PLACEHOLDER_DEFAULT_SIZE: number = 600;

/** Minimum allowed placeholder dimension (pixels). */
export const PLACEHOLDER_MIN_SIZE: number = 1;

/** Maximum allowed placeholder dimension (pixels). */
export const PLACEHOLDER_MAX_SIZE: number = 2000;

/** Cache duration for placeholder images (seconds). */
export const PLACEHOLDER_CACHE_MAX_AGE: number = 86400;

// ── Integration URLs ──────────────────────────────────────────────────

/** Brevo transactional email API endpoint. */
export const BREVO_API_URL: string = "https://api.brevo.com/v3/smtp/email";

/** Printful API base URL. */
export const PRINTFUL_API_BASE_URL: string = "https://api.printful.com";

/** Placeholder email used when creating orders in mock/demo mode. */
export const MOCK_ORDER_EMAIL: string = "mock@example.com";