/**
 * HTTP Constants
 *
 * Centralized HTTP status codes, headers, and content types
 * used across all load test scenarios.
 */

/** @type {Readonly<{OK: number, FOUND: number, SEE_OTHER: number, BAD_REQUEST: number, FORBIDDEN: number, NOT_FOUND: number, SERVER_ERROR: number}>} */
export const HTTP_STATUS = Object.freeze({
	OK: 200,
	FOUND: 302,
	SEE_OTHER: 303,
	BAD_REQUEST: 400,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	SERVER_ERROR: 500
});

/** @type {Readonly<{CONTENT_TYPE: string, ACCEPT: string, ORIGIN: string}>} */
export const HTTP_HEADER = Object.freeze({
	CONTENT_TYPE: "Content-Type",
	ACCEPT: "Accept",
	ORIGIN: "Origin"
});

/** @type {Readonly<{JSON: string, HTML: string}>} */
export const CONTENT_TYPE = Object.freeze({
	JSON: "application/json",
	HTML: "text/html"
});
