/**
 * HTTP Constants
 * Shared status codes, headers, and content types for all load test scenarios.
 */

/** HTTP status codes used in load test checks. */
export const HTTP_STATUS =
	Object.freeze(
		{
			OK: 200,
			CREATED: 201,
			NO_CONTENT: 204,
			FOUND: 302,
			BAD_REQUEST: 400,
			CONFLICT: 409,
			TOO_MANY_REQUESTS: 429,
			INTERNAL_SERVER_ERROR: 500
		});

/** HTTP headers. */
export const HTTP_HEADER =
	Object.freeze(
		{
			CONTENT_TYPE: "Content-Type",
			AUTHORIZATION: "Authorization",
			LOCATION: "Location",
			RETRY_AFTER: "Retry-After"
		});

/** Content type values. */
export const CONTENT_TYPE =
	Object.freeze(
		{
			JSON: "application/json"
		});
