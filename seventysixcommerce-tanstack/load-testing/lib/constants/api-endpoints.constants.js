/**
 * TanStack Ecommerce API Endpoint Constants
 *
 * Centralized endpoint paths for the TanStack commerce app.
 * All paths are relative — prepend CONFIG.baseUrl before use.
 *
 * Note: Cart mutations use TanStack's internal /_server RPC protocol
 * and are not suitable for direct HTTP load testing. SSR page loads
 * and the health endpoint are the primary load test targets.
 */

/** @type {Readonly<{CHECK: string}>} */
export const HEALTH_ENDPOINTS = Object.freeze({
	CHECK: "/api/healthz"
});

/** @type {Readonly<{HOME: string, SHOP: string, CATEGORY: (category: string) => string, PRODUCT: (category: string, slug: string) => string}>} */
export const SHOP_ENDPOINTS = Object.freeze({
	HOME: "/",
	SHOP: "/shop",
	CATEGORY: (category) => `/shop/${category}`,
	PRODUCT: (category, slug) => `/shop/${category}/${slug}`
});

/** @type {Readonly<{PAGE: string}>} */
export const CART_ENDPOINTS = Object.freeze({
	PAGE: "/cart"
});

/** @type {Readonly<{PAGE: string}>} */
export const CHECKOUT_ENDPOINTS = Object.freeze({
	PAGE: "/checkout"
});
