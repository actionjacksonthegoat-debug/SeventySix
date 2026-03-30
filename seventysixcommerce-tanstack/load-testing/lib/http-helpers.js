/**
 * HTTP Helper Functions for TanStack Load Tests
 *
 * Provides simplified HTTP methods for the public TanStack ecommerce site.
 * No authentication required — all endpoints are public.
 *
 * @example
 * import { publicGet } from "../lib/http-helpers.js";
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
