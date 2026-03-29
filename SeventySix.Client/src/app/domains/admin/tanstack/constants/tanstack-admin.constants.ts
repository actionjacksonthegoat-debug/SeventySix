import { environment } from "@environments/environment";

/**
 * TanStack admin section constants.
 * Centralizes dashboard UIDs, source context, and route paths.
 */

/**
 * Source context identifier for TanStack sandbox log filtering.
 * @type {string}
 */
export const TANSTACK_SOURCE_CONTEXT: string = "seventysixcommerce-tanstack";

/**
 * Grafana dashboard UIDs for TanStack performance and commerce dashboards.
 */
export const TANSTACK_DASHBOARD_UIDS: Readonly<{
	PERFORMANCE: string;
	COMMERCE: string;
}> =
	{
	/** TanStack performance dashboard UID. */
		PERFORMANCE: environment.observability.dashboards.tanstackPerformance,
		/** TanStack commerce analytics dashboard UID. */
		COMMERCE: environment.observability.dashboards.tanstackCommerce
	} as const;

/**
 * Route paths for the TanStack admin section.
 */
export const TANSTACK_ADMIN_ROUTES: Readonly<{
	DASHBOARD: string;
	LOGS: string;
}> =
	{
	/** TanStack dashboard route path. */
		DASHBOARD: "/admin/tanstack",
		/** TanStack logs route path. */
		LOGS: "/admin/tanstack/logs"
	} as const;