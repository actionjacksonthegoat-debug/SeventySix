/**
 * HTTP Helper Functions for SvelteKit Load Tests
 *
 * Provides simplified HTTP methods for the public SvelteKit ecommerce site.
 * No authentication required — all endpoints are public.
 *
 * @example
 * import { publicGet, publicFormPost } from "../lib/http-helpers.js";
 * const response = publicGet(`${CONFIG.baseUrl}/shop`);
 */

import http from "k6/http";

/**
 * Performs a GET request to a public endpoint.
 *
 * @param {string} url
 * Full URL to request.
 *
 * @param {object} [params]
 * Optional k6 request parameters (headers, tags, etc.).
 *
 * @returns {object}
 * k6 response object.
 */
export function publicGet(url, params)
{
	return http.get(url, params);
}

/**
 * Performs a POST with form-encoded body (for SvelteKit form actions).
 *
 * @param {string} url
 * Full URL including form action query (e.g., `/cart?/addToCart`).
 *
 * @param {object} formFields
 * Key-value pairs to send as form data.
 *
 * @param {object} [params]
 * Optional k6 request parameters (headers, tags, etc.).
 *
 * @returns {object}
 * k6 response object.
 */
export function publicFormPost(url, formFields, params)
{
	return http.post(url, formFields, params);
}
