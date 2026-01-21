// <copyright file="admin-routes.constants.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Admin domain route path constants.
 * Centralizes admin-specific routing to eliminate hardcoded strings.
 */
export const ADMIN_ROUTES: Readonly<{
	ROOT: "/admin";
	DASHBOARD: "/admin/dashboard";
	USERS: {
		LIST: "/admin/users";
		CREATE: "/admin/users/create";
		DETAIL: (userId: number | string) => string;
		EDIT: (userId: number | string) => string;
	};
	LOGS: {
		LIST: "/admin/logs";
		DETAIL: (logId: number | string) => string;
	};
	PERMISSION_REQUESTS: {
		LIST: "/admin/permission-requests";
	};
}> =
	{
	/** Admin root route. */
		ROOT: "/admin",
		/** Admin dashboard route. */
		DASHBOARD: "/admin/dashboard",
		/** User management routes. */
		USERS: {
			LIST: "/admin/users",
			CREATE: "/admin/users/create",
			/**
		 * Generates route for user detail page.
		 * @param userId - The user identifier.
		 * @returns The user detail route path.
		 */
			DETAIL: (userId: number | string): string =>
				`/admin/users/${userId}`,
			/**
		 * Generates route for user edit page.
		 * @param userId - The user identifier.
		 * @returns The user edit route path.
		 */
			EDIT: (userId: number | string): string =>
				`/admin/users/${userId}/edit`
		},
		/** Log management routes. */
		LOGS: {
			LIST: "/admin/logs",
			/**
		 * Generates route for log detail page.
		 * @param logId - The log identifier.
		 * @returns The log detail route path.
		 */
			DETAIL: (logId: number | string): string =>
				`/admin/logs/${logId}`
		},
		/** Permission request routes. */
		PERMISSION_REQUESTS: {
			LIST: "/admin/permission-requests"
		}
	} as const;
