import { environment } from "@environments/environment";

/**
 * SvelteKit admin section constants.
 * Centralizes dashboard UIDs, source context, and route paths.
 */

/**
 * Source context identifier for SvelteKit sandbox log filtering.
 * @type {string}
 */
export const SVELTE_SOURCE_CONTEXT: string = "seventysixcommerce-sveltekit";

/**
 * Grafana dashboard UIDs for SvelteKit performance and commerce dashboards.
 */
export const SVELTE_DASHBOARD_UIDS: Readonly<{
	PERFORMANCE: string;
	COMMERCE: string;
}> =
	{
	/** SvelteKit performance dashboard UID. */
		PERFORMANCE: environment.observability.dashboards.sveltePerformance,
		/** SvelteKit commerce analytics dashboard UID. */
		COMMERCE: environment.observability.dashboards.svelteCommerce
	} as const;

/**
 * Route paths for the SvelteKit admin section.
 */
export const SVELTE_ADMIN_ROUTES: Readonly<{
	DASHBOARD: string;
	LOGS: string;
}> =
	{
	/** SvelteKit dashboard route path. */
		DASHBOARD: "/admin/svelte",
		/** SvelteKit logs route path. */
		LOGS: "/admin/svelte/logs"
	} as const;