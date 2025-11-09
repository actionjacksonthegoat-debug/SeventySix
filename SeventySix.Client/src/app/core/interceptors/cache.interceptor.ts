import { HttpInterceptorFn, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

/**
 * Cache entry with expiration.
 */
interface CacheEntry
{
	response: HttpResponse<unknown>;
	timestamp: number;
}

/**
 * HTTP cache interceptor.
 * Caches GET requests to reduce server load and improve performance.
 * Uses a simple in-memory cache with TTL (time-to-live).
 */
export const cacheInterceptor: HttpInterceptorFn = (req, next) =>
{
	// Only cache GET requests
	if (req.method !== "GET")
	{
		return next(req);
	}

	// Skip caching for specific URLs
	if (req.url.includes("/auth/") || req.url.includes("/user/"))
	{
		return next(req);
	}

	// Check cache
	const cachedResponse = cache.get(req.url);
	if (cachedResponse)
	{
		// Return cached response as observable
		return new Observable((observer) =>
		{
			observer.next(cachedResponse);
			observer.complete();
		});
	}

	// Make request and cache response
	return next(req).pipe(
		tap((event) =>
		{
			if (event instanceof HttpResponse)
			{
				cache.set(req.url, event);
			}
		})
	);
};

/**
 * Simple in-memory cache with TTL.
 */
class HttpCache
{
	private readonly cache = new Map<string, CacheEntry>();
	private readonly defaultTtl = 5 * 60 * 1000; // 5 minutes

	/**
	 * Gets cached response if not expired.
	 */
	get(url: string): HttpResponse<unknown> | null
	{
		const entry = this.cache.get(url);
		if (!entry)
		{
			return null;
		}

		const isExpired = Date.now() - entry.timestamp > this.defaultTtl;
		if (isExpired)
		{
			this.cache.delete(url);
			return null;
		}

		return entry.response;
	}

	/**
	 * Stores response in cache.
	 */
	set(url: string, response: HttpResponse<unknown>): void
	{
		this.cache.set(url, {
			response,
			timestamp: Date.now()
		});
	}

	/**
	 * Clears all cached entries.
	 */
	clear(): void
	{
		this.cache.clear();
	}

	/**
	 * Clears cache entries matching a pattern.
	 */
	clearPattern(pattern: string): void
	{
		for (const key of this.cache.keys())
		{
			if (key.includes(pattern))
			{
				this.cache.delete(key);
			}
		}
	}
}

// Singleton cache instance
const cache = new HttpCache();

/**
 * Clears the HTTP cache.
 * Useful for invalidating cache after mutations.
 */
export function clearHttpCache(): void
{
	cache.clear();
}

/**
 * Clears cache entries matching a pattern.
 * Example: clearHttpCachePattern('/api/weather') clears all weather-related cache.
 */
export function clearHttpCachePattern(pattern: string): void
{
	cache.clearPattern(pattern);
}
