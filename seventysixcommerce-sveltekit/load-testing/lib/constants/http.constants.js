/**
 * HTTP Constants
 *
 * Centralized HTTP status codes, headers, and content types
 * used across all load test scenarios.
 */

/** @type {Readonly<{OK: number, FOUND: number, SEE_OTHER: number, BAD_REQUEST: number, NOT_FOUND: number, SERVER_ERROR: number}>} */
export const HTTP_STATUS = Object.freeze({
	OK: 200,
	FOUND: 302,
	SEE_OTHER: 303,
	BAD_REQUEST: 400,
	NOT_FOUND: 404,
	SERVER_ERROR: 500
});

/** @type {Readonly<{CONTENT_TYPE: string, ACCEPT: string}>} */
export const HTTP_HEADER = Object.freeze({
	CONTENT_TYPE: "Content-Type",
	ACCEPT: "Accept"
});

/** @type {Readonly<{JSON: string, HTML: string, FORM: string}>} */
export const CONTENT_TYPE = Object.freeze({
	JSON: "application/json",
	HTML: "text/html",
	FORM: "application/x-www-form-urlencoded"
});
