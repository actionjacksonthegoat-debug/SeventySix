/**
 * Cart Flow Load Test Scenario
 *
 * Simulates a user adding a product to cart, viewing the cart,
 * and removing the item. Tests SvelteKit form actions under load.
 *
 * Flow: Browse product → Add to cart → View cart → Remove item
 *
 * @module scenarios/cart/cart-flow.test
 */

import { sleep, check } from "k6";
import { parseHTML } from "k6/html";
import { CONFIG, getOptions } from "../../lib/config.js";
import { isStatus200, isHtmlResponse } from "../../lib/checks.js";
import { publicGet, publicFormPost } from "../../lib/http-helpers.js";
import { isSetupMissing } from "../../lib/guards.js";
import { createSummaryHandler } from "../../lib/summary.js";
import {
	SHOP_ENDPOINTS,
	CART_ENDPOINTS,
	SLOW_THRESHOLDS,
	SLEEP_DURATION,
	SEED_PRODUCTS,
	FLOW_TAGS,
	OPERATION_TAGS,
	buildTags
} from "../../lib/constants/index.js";

/** @type {import("k6/options").Options} */
export const options = {
	...getOptions(),
	thresholds: SLOW_THRESHOLDS
};

/**
 * Setup: Warmup and extract product/variant IDs from a product page.
 *
 * @returns {{ baseUrl: string, product: {category: string, slug: string, productId: string, variantId: string} } | null}
 * Shared data with extracted IDs, or null if extraction fails.
 */
export function setup()
{
	const seedProduct = SEED_PRODUCTS[0];
	const productUrl =
		`${CONFIG.baseUrl}${SHOP_ENDPOINTS.PRODUCT(seedProduct.category, seedProduct.slug)}`;

	const response = publicGet(productUrl);

	if (response.status !== 200)
	{
		console.error(
			`Setup failed: product page returned ${response.status}`
		);
		return null;
	}

	const document = parseHTML(response.body);
	const productId =
		document.find("input[name=\"productId\"]").first().attr("value");
	const variantId =
		document.find("input[name=\"variantId\"]").first().attr("value");

	if (!productId || !variantId)
	{
		console.error(
			"Setup failed: could not extract productId/variantId from product page"
		);
		return null;
	}

	console.log(
		`Cart setup: productId=${productId}, variantId=${variantId}`
	);

	return {
		baseUrl: CONFIG.baseUrl,
		product: {
			category: seedProduct.category,
			slug: seedProduct.slug,
			productId,
			variantId
		}
	};
}

/**
 * Default VU function: Add to cart → View cart → Remove item.
 *
 * @param {{ baseUrl: string, product: {category: string, slug: string, productId: string, variantId: string} } | null} data
 * Setup data with extracted product IDs.
 */
export default function cartFlow(data)
{
	if (isSetupMissing(data)) return;

	const addTags =
		buildTags(FLOW_TAGS.CART, OPERATION_TAGS.ADD_TO_CART);
	const addResponse =
		publicFormPost(
			`${data.baseUrl}${CART_ENDPOINTS.ADD_TO_CART(data.product.category, data.product.slug)}`,
			{
				productId: data.product.productId,
				variantId: data.product.variantId,
				quantity: "1"
			},
			{ tags: addTags, redirects: 5 }
		);

	check(addResponse, {
		"add to cart succeeds": (response) =>
			response.status === 200 || response.status === 303
	});
	sleep(SLEEP_DURATION.MEDIUM);

	const viewTags =
		buildTags(FLOW_TAGS.CART, OPERATION_TAGS.VIEW_CART);
	const cartResponse =
		publicGet(
			`${data.baseUrl}${CART_ENDPOINTS.PAGE}`,
			{ tags: viewTags }
		);
	isStatus200(cartResponse);
	isHtmlResponse(cartResponse);

	const cartDocument = parseHTML(cartResponse.body);
	const cartItemId =
		cartDocument.find("input[name=\"cartItemId\"]").first().attr("value");

	sleep(SLEEP_DURATION.SHORT);

	if (cartItemId)
	{
		const removeTags =
			buildTags(FLOW_TAGS.CART, OPERATION_TAGS.REMOVE_ITEM);
		const removeResponse =
			publicFormPost(
				`${data.baseUrl}${CART_ENDPOINTS.REMOVE_ITEM}`,
				{ cartItemId },
				{ tags: removeTags, redirects: 5 }
			);

		check(removeResponse, {
			"remove from cart succeeds": (response) =>
				response.status === 200 || response.status === 303
		});
	}

	sleep(SLEEP_DURATION.MEDIUM);
}

/**
 * Generates HTML and JSON reports.
 *
 * @param {object} data
 * k6 summary data.
 *
 * @returns {object}
 * Report output targets.
 */
export function handleSummary(data)
{
	return createSummaryHandler(data);
}
