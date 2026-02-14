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
			BAD_REQUEST: 400,
			CONFLICT: 409,
			INTERNAL_SERVER_ERROR: 500
		});

/** HTTP headers. */
export const HTTP_HEADER =
	Object.freeze(
		{
			CONTENT_TYPE: "Content-Type",
			AUTHORIZATION: "Authorization"
		});

/** Content type values. */
export const CONTENT_TYPE =
	Object.freeze(
		{
			JSON: "application/json"
		});
