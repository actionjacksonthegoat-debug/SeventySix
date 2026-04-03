/**
 * Scenario Tag Constants
 *
 * Tags applied to k6 requests for filtering and threshold targeting.
 * Follow the pattern: FLOW_TAGS for broad categories, OPERATION_TAGS for specific actions.
 */

/** @type {Readonly<{HEALTH: string, BROWSE: string, CART: string, CHECKOUT: string}>} */
export const FLOW_TAGS = Object.freeze({
	HEALTH: "health",
	BROWSE: "browse",
	CART: "cart",
	CHECKOUT: "checkout"
});

/** @type {Readonly<{HEALTH_CHECK: string, BROWSE_HOME: string, BROWSE_SHOP: string, BROWSE_CATEGORY: string, BROWSE_PRODUCT: string, ADD_TO_CART: string, VIEW_CART: string, UPDATE_QUANTITY: string, REMOVE_ITEM: string, CHECKOUT: string}>} */
export const OPERATION_TAGS = Object.freeze({
	HEALTH_CHECK: "health-check",
	BROWSE_HOME: "browse-home",
	BROWSE_SHOP: "browse-shop",
	BROWSE_CATEGORY: "browse-category",
	BROWSE_PRODUCT: "browse-product",
	ADD_TO_CART: "add-to-cart",
	VIEW_CART: "view-cart",
	UPDATE_QUANTITY: "update-quantity",
	REMOVE_ITEM: "remove-item",
	CHECKOUT: "checkout"
});

/**
 * Builds a tags object for k6 request parameters.
 *
 * @param {string} flow
 * The flow tag (from FLOW_TAGS).
 *
 * @param {string} operation
 * The operation tag (from OPERATION_TAGS).
 *
 * @returns {{ flow: string, operation: string }}
 * Tags object for k6 request params.
 */
export function buildTags(flow, operation)
{
	return { flow, operation };
}
