/**
 * Request Tag Constants
 * k6 request tags for metric grouping and Grafana dashboarding.
 */

/** Flow identifiers for metric grouping. */
export const FLOW_TAGS =
	Object.freeze(
		{
			AUTH: "auth",
			HEALTH: "health",
			USERS: "users",
			PERMISSIONS: "permissions",
			LOGS: "logs",
			WARMUP: "warmup"
		});

/** Operation identifiers within each flow. */
export const OPERATION_TAGS =
	Object.freeze(
		{
			LOGIN: "login",
			LOGOUT: "logout",
			REFRESH: "refresh",
			REGISTRATION: "registration",
			HEALTH_CHECK: "check",
			CREATE: "create",
			UPDATE: "update",
			GET_PAGED: "get-paged",
			BULK_ACTIVATE: "bulk-activate",
			BULK_DEACTIVATE: "bulk-deactivate",
			LIST_REQUESTS: "list-requests",
			GRANT_PERMISSION: "grant-permission",
			GET_AVAILABLE_ROLES: "get-available-roles",
			REQUEST_PERMISSION: "request-permission",
			CLIENT_LOG: "client-log",
			CLIENT_LOG_BATCH: "client-log-batch",
			OAUTH_REDIRECT: "oauth-redirect",
			OAUTH_RATE_LIMIT: "oauth-rate-limit"
		});

/**
 * Builds a k6 tags object for request tagging.
 *
 * @param {string} flow
 * The domain flow name.
 *
 * @param {string} operation
 * The specific operation name.
 *
 * @returns {{ tags: { flow: string, operation: string } }}
 * k6-compatible params with tags.
 */
export function buildTags(flow, operation)
{
	return { tags: { flow, operation } };
}
