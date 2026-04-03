/**
 * SvelteKit Ecommerce API Endpoint Constants
 *
 * Centralized endpoint paths for the SvelteKit commerce app.
 * All paths are relative — prepend CONFIG.baseUrl before use.
 */

/** @type {Readonly<{CHECK: string}>} */
export const HEALTH_ENDPOINTS = Object.freeze({
	CHECK: "/healthz"
});

/** @type {Readonly<{HOME: string, SHOP: string, CATEGORY: (category: string) => string, PRODUCT: (category: string, slug: string) => string}>} */
export const SHOP_ENDPOINTS = Object.freeze({
	HOME: "/",
	SHOP: "/shop",
	CATEGORY: (category) => `/shop/${category}`,
	PRODUCT: (category, slug) => `/shop/${category}/${slug}`
});

/** @type {Readonly<{PAGE: string, ADD_TO_CART: (category: string, slug: string) => string, UPDATE_QUANTITY: string, REMOVE_ITEM: string}>} */
export const CART_ENDPOINTS = Object.freeze({
	PAGE: "/cart",
	ADD_TO_CART: (category, slug) =>
		`/shop/${category}/${slug}?/addToCart`,
	UPDATE_QUANTITY: "/cart?/updateQuantity",
	REMOVE_ITEM: "/cart?/removeItem"
});

/** @type {Readonly<{PAGE: string}>} */
export const CHECKOUT_ENDPOINTS = Object.freeze({
	PAGE: "/checkout"
});
