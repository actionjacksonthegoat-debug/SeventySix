import { HttpInterceptorFn, HttpResponse } from "@angular/common/http";
import { inject, isDevMode } from "@angular/core";
import { filter } from "rxjs/operators";
import { CacheService } from "@core/services/cache.service";
import { CacheConfigService } from "@core/services/cache-config.service";

/**
 * HTTP cache interceptor with Service Worker integration.
 * Caches GET requests to reduce server load and improve performance.
 * Features:
 * - Inflight request deduplication
 * - Service Worker integration
 * - TTL values from ngsw-config.json (single source of truth)
 * - Pattern-based cache invalidation
 *
 * Note: Caching is disabled in development mode to allow fast iterations.
 */
export const cacheInterceptor: HttpInterceptorFn = (req, next) =>
{
	// Disable caching in development mode for fast iterations
	if (isDevMode())
	{
		return next(req);
	}

	const cacheService = inject(CacheService);
	const cacheConfigService = inject(CacheConfigService);

	// Only cache GET requests
	if (req.method !== "GET")
	{
		return next(req);
	}

	// Skip caching for specific URLs (auth, user profile, real-time data)
	if (
		req.url.includes("/auth/") ||
		req.url.includes("/user/") ||
		req.url.includes("/realtime/")
	)
	{
		return next(req);
	}

	// Get cache TTL from ngsw-config.json dataGroups
	const ttl = cacheConfigService.getTtl(req.url);

	// Check for cache-control headers to force refresh
	const forceRefresh =
		req.headers.get("Cache-Control") === "no-cache" ||
		req.headers.get("Cache-Control") === "no-store";

	// Use CacheService with inflight request deduplication
	return cacheService.get<HttpResponse<unknown>>(
		req.url,
		next(req).pipe(
			// Filter to only process HttpResponse events (ignore HttpSentEvent, etc.)
			filter((event) => event instanceof HttpResponse),
			// Only cache successful responses (200 OK)
			filter((response: HttpResponse<unknown>) => response.status === 200)
		),
		{
			ttl,
			forceRefresh,
			useServiceWorker: true,
			prefix: "http-cache"
		}
	);
};

/**
 * Clears the HTTP cache.
 * Useful for invalidating cache after mutations.
 */
export function clearHttpCache(): void
{
	const cacheService = inject(CacheService);
	cacheService.clearAll({ prefix: "http-cache" }).subscribe();
}

/**
 * Clears cache entries matching a pattern.
 * Example: clearHttpCachePattern('/api/weather') clears all weather-related cache.
 */
export function clearHttpCachePattern(pattern: string): void
{
	const cacheService = inject(CacheService);
	cacheService.clearPattern(pattern, { prefix: "http-cache" }).subscribe();
}
