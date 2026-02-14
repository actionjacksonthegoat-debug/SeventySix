/**
 * API Endpoint Constants
 * Centralized URL path segments for all load test scenarios.
 */

/** Auth endpoints. */
export const AUTH_ENDPOINTS =
	Object.freeze(
		{
			LOGIN: "/auth/login",
			LOGOUT: "/auth/logout",
			REFRESH: "/auth/refresh",
			REGISTER_INITIATE: "/auth/register/initiate"
		});

/** User endpoints. */
export const USER_ENDPOINTS =
	Object.freeze(
		{
			BASE: "/users",
			PAGED: "/users/paged",
			BULK_ACTIVATE: "/users/bulk/activate",
			BULK_DEACTIVATE: "/users/bulk/deactivate"
		});

/** Permission endpoints. */
export const PERMISSION_ENDPOINTS =
	Object.freeze(
		{
			REQUESTS: "/users/permission-requests",
			AVAILABLE_ROLES: "/users/me/available-roles",
			MY_REQUESTS: "/users/me/permission-requests",
			approveById: (requestId) =>
				`/users/permission-requests/${requestId}/approve`
		});

/** Log endpoints. */
export const LOG_ENDPOINTS =
	Object.freeze(
		{
			CLIENT: "/logs/client",
			CLIENT_BATCH: "/logs/client/batch"
		});

/** Health endpoints (relative to base URL, not API URL). */
export const HEALTH_ENDPOINTS =
	Object.freeze(
		{
			CHECK: "/health"
		});
