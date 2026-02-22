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
 * Checks that the response status is 201.
 *
 * @param {object} response
 * k6 response object.
 *
 * @returns {boolean}
 * True if all checks passed.
 */
export function isStatus201(response)
{
	return check(response,
		{
			"status is 201": (response) =>
				response.status === HTTP_STATUS.CREATED
		});
}

/**
 * Checks that the response status is 204.
 *
 * @param {object} response
 * k6 response object.
 *
 * @returns {boolean}
 * True if all checks passed.
 */
export function isStatus204(response)
{
	return check(response,
		{
			"status is 204": (response) =>
				response.status === HTTP_STATUS.NO_CONTENT
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
 * Checks that the response body contains an accessToken field.
 *
 * @param {object} response
 * k6 response object.
 *
 * @returns {boolean}
 * True if all checks passed.
 */
export function hasAccessToken(response)
{
	return check(response,
		{
			"body has accessToken": (response) =>
			{
				const body =
					response.json();
				return body != null && body.accessToken != null;
			}
		});
}

/**
 * Checks that the response body contains a paged result with items.
 *
 * @param {object} response
 * k6 response object.
 *
 * @returns {boolean}
 * True if all checks passed.
 */
export function hasPagedItems(response)
{
	return check(response,
		{
			"body has items array": (response) =>
			{
				const body =
					response.json();
				return body && Array.isArray(body.items);
			}
		});
}
