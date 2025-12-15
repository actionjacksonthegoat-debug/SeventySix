import { environment } from "@environments/environment";

/**
 * Query options interface for TanStack Query configuration.
 */
export interface QueryOptions
{
	staleTime?: number;
	gcTime?: number;
	retry?: number;
}

/**
 * Get TanStack Query configuration for a specific resource.
 * Falls back to default configuration if resource-specific config not found.
 *
 * @param resource - The resource name (e.g., 'users', 'logs', 'health')
 * @returns Query options with staleTime, gcTime, and retry settings
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
