/**
 * Reusable k6 check() Assertions
 *
 * Provides common response validations to reduce duplication across scenarios.
 *
 * @example
 * import { isStatus200, isJsonResponse } from "../lib/checks.js";
 * isStatus200(response);
 */

import { check } from "k6";
import { CONTENT_TYPE, HTTP_HEADER, HTTP_STATUS } from "./constants/index.js";

/**
 * Checks that the response status matches the expected status code.
 *
 * @param {object} response
 * k6 response object.
 *
 * @param {number} expectedStatus
 * HTTP status code to assert.
 *
 * @returns {boolean}
 * True if all checks passed.
 */
export function isStatus(response, expectedStatus)
{
	return check(response,
		{
			[`status is ${expectedStatus}`]: (response) =>
				response.status === expectedStatus
		});
}

/**
 * Checks that the response status is 200.
 *
 * @param {object} response
 * k6 response object.
 *
 * @returns {boolean}
 * True if all checks passed.
 */
export function isStatus200(response)
{
	return check(response,
		{
			"status is 200": (response) =>
				response.status === HTTP_STATUS.OK
		});
}

/**
 * Checks that the response has a JSON content type.
 *
 * @param {object} response
 * k6 response object.
 *
 * @returns {boolean}
 * True if all checks passed.
 */
export function isJsonResponse(response)
{
	return check(response,
		{
			"response is JSON": (response) =>
			{
				const contentType =
					response.headers[HTTP_HEADER.CONTENT_TYPE] ?? "";
				return contentType.includes(CONTENT_TYPE.JSON);
			}
		});
}

/**
 * Checks that the response body contains HTML content.
 *
 * @param {object} response
 * k6 response object.
 *
 * @returns {boolean}
 * True if all checks passed.
 */
export function isHtmlResponse(response)
{
	return check(response,
		{
			"response is HTML": (response) =>
			{
				const contentType =
					response.headers[HTTP_HEADER.CONTENT_TYPE] ?? "";
				return contentType.includes(CONTENT_TYPE.HTML);
			}
		});
}
