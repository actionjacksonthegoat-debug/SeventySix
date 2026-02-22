/**
 * Authenticated HTTP Request Helpers
 *
 * Wraps k6 http methods with Authorization: Bearer header injection.
 *
 * @example
 * import { authenticatedGet, authenticatedPost } from "../lib/http-helpers.js";
 * const response = authenticatedGet(url, authData.accessToken, { tags: { flow: "users" } });
 */

import http from "k6/http";
import { CONTENT_TYPE, HTTP_HEADER } from "./constants/index.js";

/**
 * Builds request params with Authorization header.
 *
 * @param {string} token
 * The JWT access token.
 *
 * @param {object} [extraParams]
 * Additional k6 request params to merge.
 *
 * @returns {object}
 * Merged params with auth header.
 */
function buildParams(token, extraParams)
{
	const params =
		Object.assign({}, extraParams ?? {});
	const headers =
		Object.assign({}, params.headers ?? {});
	headers[HTTP_HEADER.AUTHORIZATION] =
		`Bearer ${token}`;
	params.headers = headers;
	return params;
}

/**
 * Authenticated GET request.
 *
 * @param {string} url
 * The URL to request.
 *
 * @param {string} token
 * The JWT access token.
 *
 * @param {object} [params]
 * Additional k6 request params.
 *
 * @returns {object}
 * k6 response object.
 */
export function authenticatedGet(url, token, params)
{
	return http.get(url, buildParams(token, params));
}

/**
 * Authenticated POST request.
 *
 * @param {string} url
 * The URL to request.
 *
 * @param {string} token
 * The JWT access token.
 *
 * @param {*} body
 * The request body (will be JSON.stringify'd if object).
 *
 * @param {object} [params]
 * Additional k6 request params.
 *
 * @returns {object}
 * k6 response object.
 */
export function authenticatedPost(url, token, body, params)
{
	const mergedParams =
		buildParams(token, params);
	if (mergedParams.headers[HTTP_HEADER.CONTENT_TYPE] == null)
	{
		mergedParams.headers[HTTP_HEADER.CONTENT_TYPE] =
			CONTENT_TYPE.JSON;
	}
	const payload =
		typeof body === "object" ? JSON.stringify(body) : body;
	return http.post(url, payload, mergedParams);
}

/**
 * Authenticated PUT request.
 *
 * @param {string} url
 * The URL to request.
 *
 * @param {string} token
 * The JWT access token.
 *
 * @param {*} body
 * The request body.
 *
 * @param {object} [params]
 * Additional k6 request params.
 *
 * @returns {object}
 * k6 response object.
 */
export function authenticatedPut(url, token, body, params)
{
	const mergedParams =
		buildParams(token, params);
	if (mergedParams.headers[HTTP_HEADER.CONTENT_TYPE] == null)
	{
		mergedParams.headers[HTTP_HEADER.CONTENT_TYPE] =
			CONTENT_TYPE.JSON;
	}
	const payload =
		typeof body === "object" ? JSON.stringify(body) : body;
	return http.put(url, payload, mergedParams);
}

/**
 * Authenticated DELETE request.
 *
 * @param {string} url
 * The URL to request.
 *
 * @param {string} token
 * The JWT access token.
 *
 * @param {object} [params]
 * Additional k6 request params.
 *
 * @returns {object}
 * k6 response object.
 */
export function authenticatedDelete(url, token, params)
{
	return http.del(url, null, buildParams(token, params));
}
