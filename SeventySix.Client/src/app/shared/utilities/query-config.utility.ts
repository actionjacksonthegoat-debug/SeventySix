import { environment } from "@environments/environment";

/**
 * Query options for TanStack Query configuration.
 *
 * Describes caching and retry behaviour for a query resource.
 *
 * @property {number | undefined} staleTime
 * Time in milliseconds before a query becomes stale.
 *
 * @property {number | undefined} gcTime
 * Time in milliseconds before unused query data is garbage collected.
 *
 * @property {number | undefined} retry
 * Number of automatic retry attempts for failed queries.
 */
export interface QueryOptions
{
	/**
	 * @type {number | undefined}
	 * Time in milliseconds before a query becomes stale.
	 */
	staleTime?: number;

	/**
	 * @type {number | undefined}
	 * Time in milliseconds before unused query data is garbage collected.
	 */
	gcTime?: number;

	/**
	 * @type {number | undefined}
	 * Number of automatic retry attempts for failed queries.
	 */
	retry?: number;
}

/**
 * Get the TanStack Query configuration for a specific resource.
 *
 * Resolves a resource-specific cache configuration from the application
 * environment. When a resource-specific configuration is not defined the
 * function falls back to the configured defaults.
 *
 * @param {string} resource
 * The resource name for which to resolve query configuration (for example
 * 'users', 'logs' or 'health').
 *
 * @returns {QueryOptions}
 * The resolved query options containing `staleTime`, `gcTime` and `retry`
 * settings.
 *
 * @example
 * const userConfig = getQueryConfig('users');
 * // Returns: { staleTime: 300000, gcTime: 600000, retry: 2 }
 */
export function getQueryConfig(resource: string): QueryOptions
{
	const config: typeof environment.cache.query =
		environment.cache.query;
	const resourceConfig: QueryOptions | undefined =
		config[
			resource as keyof typeof config
		] as QueryOptions | undefined;

	if (resourceConfig && typeof resourceConfig === "object")
	{
		return {
			staleTime: resourceConfig.staleTime,
			gcTime: resourceConfig.gcTime,
			retry: resourceConfig.retry
		};
	}

	return {
		staleTime: config.default.staleTime,
		gcTime: config.default.gcTime,
		retry: config.default.retry
	};
}
