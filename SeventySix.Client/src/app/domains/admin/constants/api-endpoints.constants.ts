// <copyright file="api-endpoints.constants.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Admin domain API endpoint constants.
 * Centralizes endpoint strings for maintainability.
 */
export const ADMIN_API_ENDPOINTS: Readonly<{
	/** User management endpoint. */
	USERS: "users";
	/** Log management endpoint. */
	LOGS: "logs";
	/** Health check endpoint. */
	HEALTH: "health";
	/** Third-party API requests management endpoint. */
	THIRD_PARTY_REQUESTS: "thirdpartyrequests";
	/** Permission requests endpoint. */
	PERMISSION_REQUESTS: "permissionrequests";
}> =
	{
		USERS: "users",
		LOGS: "logs",
		HEALTH: "health",
		THIRD_PARTY_REQUESTS: "thirdpartyrequests",
		PERMISSION_REQUESTS: "permissionrequests"
	} as const;

/**
 * Sandbox container source context identifiers.
 * Used to filter logs by origin application.
 */
export const SANDBOX_SOURCES: Readonly<{
	SVELTEKIT: "seventysixcommerce-sveltekit";
	TANSTACK: "seventysixcommerce-tanstack";
}> =
	{
		SVELTEKIT: "seventysixcommerce-sveltekit",
		TANSTACK: "seventysixcommerce-tanstack"
	} as const;