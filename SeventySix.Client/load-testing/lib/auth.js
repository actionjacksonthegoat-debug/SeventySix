/**
 * k6 Authentication Helper
 *
 * Provides login/logout functions for load test scenarios.
 * Uses HTTP-only cookie jar for refresh tokens.
 *
 * @example
 * import { loginAsAdmin, loginAsUser } from "../lib/auth.js";
 * const authData = loginAsAdmin();
 * // authData.accessToken, authData.jar
 */

import { check } from "k6";
import http from "k6/http";
import { CONFIG } from "./config.js";
import {
	AUTH_ENDPOINTS,
	buildTags,
	CONTENT_TYPE,
	FLOW_TAGS,
	HEALTH_ENDPOINTS,
	HTTP_HEADER,
	HTTP_STATUS,
	OPERATION_TAGS
} from "./constants/index.js";

/**
 * Sends a single GET /health request to warm up the API connection.
 *
 * Call this inside `setup()` so the first cold-start request is excluded
 * from the measured load-test metrics (k6 does not count setup traffic).
 */
export function warmup()
{
	http.get(`${CONFIG.baseUrl}${HEALTH_ENDPOINTS.CHECK}`, buildTags(FLOW_TAGS.WARMUP, OPERATION_TAGS.HEALTH_CHECK));
}

/**
 * Logs in with the given credentials.
 *
 * @param {string} username
 * The username or email to authenticate with.
 *
 * @param {string} password
 * The password.
 *
 * @returns {{ accessToken: string, jar: object } | null}
 * Auth data on success, null on failure.
 */
export function login(username, password)
{
	const jar =
		http.cookieJar();
	const loginUrl =
		`${CONFIG.apiUrl}${AUTH_ENDPOINTS.LOGIN}`;

	const response =
		http.post(
			loginUrl,
			JSON.stringify(
				{
					usernameOrEmail: username,
					password: password
				}),
			{
				headers: { [HTTP_HEADER.CONTENT_TYPE]: CONTENT_TYPE.JSON },
				jar: jar,
				...buildTags(FLOW_TAGS.AUTH, OPERATION_TAGS.LOGIN)
			});

	const loginSucceeded =
		check(response,
			{
				"login status is 200": (response) =>
					response.status === HTTP_STATUS.OK,
				"login returns accessToken": (response) =>
				{
					const body =
						response.json();
					return body != null && body.accessToken != null;
				}
			});

	if (!loginSucceeded)
	{
		return null;
	}

	const body =
		response.json();

	return {
		accessToken: body.accessToken,
		jar: jar
	};
}

/**
 * Logs in as the pre-seeded admin user.
 *
 * @returns {{ accessToken: string, jar: object } | null}
 * Auth data on success, null on failure.
 */
export function loginAsAdmin()
{
	return login(
		CONFIG.adminCredentials.username,
		CONFIG.adminCredentials.password);
}

/**
 * Logs in as the pre-seeded regular user.
 *
 * @returns {{ accessToken: string, jar: object } | null}
 * Auth data on success, null on failure.
 */
export function loginAsUser()
{
	return login(
		CONFIG.userCredentials.username,
		CONFIG.userCredentials.password);
}

/**
 * Refreshes the access token using the cookie jar.
 *
 * @param {object} jar
 * The cookie jar containing the refresh token.
 *
 * @returns {{ accessToken: string, jar: object } | null}
 * New auth data on success, null on failure.
 */
export function refreshToken(jar)
{
	const refreshUrl =
		`${CONFIG.apiUrl}${AUTH_ENDPOINTS.REFRESH}`;

	const response =
		http.post(refreshUrl, null,
			{
				jar: jar,
				...buildTags(FLOW_TAGS.AUTH, OPERATION_TAGS.REFRESH)
			});

	const refreshSucceeded =
		check(response,
			{
				"refresh status is 200": (response) =>
					response.status === HTTP_STATUS.OK,
				"refresh returns accessToken": (response) =>
				{
					const body =
						response.json();
					return body != null && body.accessToken != null;
				}
			});

	if (!refreshSucceeded)
	{
		return null;
	}

	const body =
		response.json();

	return {
		accessToken: body.accessToken,
		jar: jar
	};
}

/**
 * Logs out by revoking the refresh token.
 *
 * @param {object} jar
 * The cookie jar containing the refresh token.
 *
 * @returns {object}
 * k6 response object.
 */
export function logout(jar)
{
	const logoutUrl =
		`${CONFIG.apiUrl}${AUTH_ENDPOINTS.LOGOUT}`;

	return http.post(logoutUrl, null,
		{
			jar: jar,
			...buildTags(FLOW_TAGS.AUTH, OPERATION_TAGS.LOGOUT)
		});
}
