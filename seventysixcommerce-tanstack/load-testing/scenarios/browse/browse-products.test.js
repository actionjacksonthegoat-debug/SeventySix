/**
 * Browse Products Load Test Scenario
 *
 * Simulates a user browsing the storefront: home page, shop listing,
 * category pages, and product detail pages. Measures SSR performance
 * under load.
 *
 * @module scenarios/browse/browse-products.test
 */

import { sleep } from "k6";
import { CONFIG, getOptions } from "../../lib/config.js";
import { isStatus200, isHtmlResponse } from "../../lib/checks.js";
import { publicGet } from "../../lib/http-helpers.js";
import { isSetupMissing } from "../../lib/guards.js";
import { createSummaryHandler } from "../../lib/summary.js";
import {
	SHOP_ENDPOINTS,
	STANDARD_THRESHOLDS,
	SLEEP_DURATION,
	SEED_CATEGORIES,
	SEED_PRODUCTS,
	FLOW_TAGS,
	OPERATION_TAGS,
	buildTags
} from "../../lib/constants/index.js";

/** @type {import("k6/options").Options} */
export const options = {
	...getOptions(),
	thresholds: STANDARD_THRESHOLDS
};

/**
 * Setup: Warmup the app and return seed data for browsing.
 *
 * @returns {{ baseUrl: string, categories: string[], products: Array<{category: string, slug: string}> }}
 * Shared data for VU iterations.
 */
export function setup()
{
	const warmupResponse =
		publicGet(`${CONFIG.baseUrl}${SHOP_ENDPOINTS.SHOP}`);

	console.log(
		`Browse warmup: status=${warmupResponse.status}`
	);

	return {
		baseUrl: CONFIG.baseUrl,
		categories: [...SEED_CATEGORIES],
		products: [...SEED_PRODUCTS]
	};
}

/**
 * Default VU function: Browse home → shop → category → product detail.
 *
 * @param {{ baseUrl: string, categories: string[], products: Array<{category: string, slug: string}> }} data
 * Setup data.
 */
export default function browseProducts(data)
{
	if (isSetupMissing(data)) return;

	const homeTags =
		buildTags(FLOW_TAGS.BROWSE, OPERATION_TAGS.BROWSE_HOME);
	const homeResponse =
		publicGet(`${data.baseUrl}${SHOP_ENDPOINTS.HOME}`, { tags: homeTags });
	isStatus200(homeResponse);
	isHtmlResponse(homeResponse);
	sleep(SLEEP_DURATION.SHORT);

	const shopTags =
		buildTags(FLOW_TAGS.BROWSE, OPERATION_TAGS.BROWSE_SHOP);
	const shopResponse =
		publicGet(`${data.baseUrl}${SHOP_ENDPOINTS.SHOP}`, { tags: shopTags });
	isStatus200(shopResponse);
	isHtmlResponse(shopResponse);
	sleep(SLEEP_DURATION.SHORT);

	const categoryIndex = __VU % data.categories.length;
	const category = data.categories[categoryIndex];
	const categoryTags =
		buildTags(FLOW_TAGS.BROWSE, OPERATION_TAGS.BROWSE_CATEGORY);
	const categoryResponse =
		publicGet(
			`${data.baseUrl}${SHOP_ENDPOINTS.CATEGORY(category)}`,
			{ tags: categoryTags }
		);
	isStatus200(categoryResponse);
	isHtmlResponse(categoryResponse);
	sleep(SLEEP_DURATION.MEDIUM);

	const productIndex = __VU % data.products.length;
	const product = data.products[productIndex];
	const productTags =
		buildTags(FLOW_TAGS.BROWSE, OPERATION_TAGS.BROWSE_PRODUCT);
	const productResponse =
		publicGet(
			`${data.baseUrl}${SHOP_ENDPOINTS.PRODUCT(product.category, product.slug)}`,
			{ tags: productTags }
		);
	isStatus200(productResponse);
	isHtmlResponse(productResponse);
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
