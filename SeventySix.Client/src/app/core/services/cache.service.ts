import { Injectable, inject } from "@angular/core";
import { SwUpdate } from "@angular/service-worker";
import { Observable, from, of, throwError } from "rxjs";
import { catchError, shareReplay, tap } from "rxjs/operators";

/**
 * Cache entry metadata for custom cache management.
 */
interface CacheEntry<T>
{
	data: T;
	timestamp: number;
	expiresAt: number;
	url: string;
}

/**
 * Cache configuration options.
 */
export interface CacheOptions
{
	/**
	 * Time-to-live in milliseconds.
	 * Default: 5 minutes (300000ms)
	 */
	ttl?: number;

	/**
	 * Whether to use Service Worker cache.
	 * Default: true
	 */
	useServiceWorker?: boolean;

	/**
	 * Cache key prefix for namespacing.
	 * Default: 'app-cache'
	 */
	prefix?: string;

	/**
	 * Whether to force refresh (bypass cache).
	 * Default: false
	 */
	forceRefresh?: boolean;
}

/**
 * Advanced caching service that integrates with Angular Service Worker
 * while maintaining custom cache control and inflight request deduplication.
 *
 * Features:
 * - Inflight request deduplication
 * - Custom TTL per cache entry
 * - Service Worker integration
 * - Pattern-based cache invalidation
 * - Memory + SW dual-layer caching
 */
@Injectable({
	providedIn: "root"
})
export class CacheService
{
	private readonly swUpdate = inject(SwUpdate);

	// In-memory cache for fast access
	private readonly memoryCache = new Map<string, CacheEntry<unknown>>();

	// Inflight requests to prevent duplicate calls
	private readonly inflightRequests = new Map<string, Observable<unknown>>();

	// Default configuration
	private readonly defaultOptions: Required<CacheOptions> = {
		ttl: 5 * 60 * 1000, // 5 minutes
		useServiceWorker: true,
		prefix: "app-cache",
		forceRefresh: false
	};

	/**
	 * Gets data from cache or executes the source observable.
	 * Handles inflight request deduplication automatically.
	 *
	 * @param key - Unique cache key
	 * @param source - Observable to execute if cache miss
	 * @param options - Cache configuration options
	 * @returns Observable with cached or fresh data
	 */
	get<T>(
		key: string,
		source: Observable<T>,
		options?: CacheOptions
	): Observable<T>
	{
		const config = { ...this.defaultOptions, ...options };
		const cacheKey = `${config.prefix}:${key}`;

		// Force refresh bypasses all caching
		if (config.forceRefresh)
		{
			return this.executeAndCache(cacheKey, source, config);
		}

		// Check for inflight request
		const inflight = this.inflightRequests.get(cacheKey);
		if (inflight)
		{
			return inflight as Observable<T>;
		}

		// Check memory cache
		const memoryEntry = this.getFromMemory<T>(cacheKey);
		if (memoryEntry !== null)
		{
			return of(memoryEntry);
		}

		// Execute source and cache result
		return this.executeAndCache(cacheKey, source, config);
	}

	/**
	 * Sets data in cache with specified TTL.
	 *
	 * @param key - Unique cache key
	 * @param data - Data to cache
	 * @param options - Cache configuration options
	 */
	set<T>(key: string, data: T, options?: CacheOptions): void
	{
		const config = { ...this.defaultOptions, ...options };
		const cacheKey = `${config.prefix}:${key}`;

		this.setInMemory(cacheKey, data, config.ttl);

		if (config.useServiceWorker)
		{
			this.setInServiceWorker(cacheKey, data).subscribe({
				error: (err) => console.warn("SW cache set failed:", err)
			});
		}
	}

	/**
	 * Removes a specific cache entry.
	 *
	 * @param key - Cache key to remove
	 * @param options - Cache configuration options
	 */
	delete(key: string, options?: CacheOptions): Observable<boolean>
	{
		const config = { ...this.defaultOptions, ...options };
		const cacheKey = `${config.prefix}:${key}`;

		this.memoryCache.delete(cacheKey);
		this.inflightRequests.delete(cacheKey);

		if (config.useServiceWorker)
		{
			return this.deleteFromServiceWorker(cacheKey);
		}

		return of(true);
	}

	/**
	 * Clears all cache entries matching a pattern.
	 *
	 * @param pattern - Pattern to match cache keys
	 * @param options - Cache configuration options
	 */
	clearPattern(pattern: string, options?: CacheOptions): Observable<void>
	{
		const config = { ...this.defaultOptions, ...options };
		const prefix = config.prefix;

		// Clear memory cache
		for (const key of this.memoryCache.keys())
		{
			if (key.includes(pattern))
			{
				this.memoryCache.delete(key);
			}
		}

		// Clear inflight requests
		for (const key of this.inflightRequests.keys())
		{
			if (key.includes(pattern))
			{
				this.inflightRequests.delete(key);
			}
		}

		// Clear Service Worker cache if enabled
		if (config.useServiceWorker)
		{
			return from(this.clearServiceWorkerPattern(pattern, prefix));
		}

		return of(void 0);
	}

	/**
	 * Clears all cache entries.
	 *
	 * @param options - Cache configuration options
	 */
	clearAll(options?: CacheOptions): Observable<void>
	{
		const config = { ...this.defaultOptions, ...options };

		this.memoryCache.clear();
		this.inflightRequests.clear();

		if (config.useServiceWorker)
		{
			return from(this.clearAllServiceWorker(config.prefix));
		}

		return of(void 0);
	}

	/**
	 * Checks if Service Worker is enabled and available.
	 */
	isServiceWorkerEnabled(): boolean
	{
		return this.swUpdate.isEnabled;
	}

	/**
	 * Gets the current cache statistics.
	 */
	getStats(): {
		memoryEntries: number;
		inflightRequests: number;
		serviceWorkerEnabled: boolean;
	}
	{
		return {
			memoryEntries: this.memoryCache.size,
			inflightRequests: this.inflightRequests.size,
			serviceWorkerEnabled: this.swUpdate.isEnabled
		};
	}

	/**
	 * Executes source observable and caches the result.
	 * Handles inflight request deduplication.
	 */
	private executeAndCache<T>(
		cacheKey: string,
		source: Observable<T>,
		config: Required<CacheOptions>
	): Observable<T>
	{
		// Create shared observable for inflight deduplication
		const shared = source.pipe(
			tap((data) =>
			{
				// Cache the result
				this.setInMemory(cacheKey, data, config.ttl);

				if (config.useServiceWorker)
				{
					this.setInServiceWorker(cacheKey, data).subscribe({
						error: (err) => console.warn("SW cache failed:", err)
					});
				}
			}),
			catchError((error) =>
			{
				// Remove from inflight on error
				this.inflightRequests.delete(cacheKey);
				return throwError(() => error);
			}),
			// Share among multiple subscribers
			shareReplay(1)
		);

		// Store as inflight request
		this.inflightRequests.set(cacheKey, shared);

		// Remove from inflight after completion
		shared.subscribe({
			complete: () => this.inflightRequests.delete(cacheKey),
			error: () => this.inflightRequests.delete(cacheKey)
		});

		return shared;
	}

	/**
	 * Gets data from memory cache if not expired.
	 */
	private getFromMemory<T>(key: string): T | null
	{
		const entry = this.memoryCache.get(key) as CacheEntry<T> | undefined;

		if (!entry)
		{
			return null;
		}

		// Check if expired
		if (Date.now() > entry.expiresAt)
		{
			this.memoryCache.delete(key);
			return null;
		}

		return entry.data;
	}

	/**
	 * Stores data in memory cache with expiration.
	 */
	private setInMemory<T>(key: string, data: T, ttl: number): void
	{
		const now = Date.now();
		const entry: CacheEntry<T> = {
			data,
			timestamp: now,
			expiresAt: now + ttl,
			url: key
		};

		this.memoryCache.set(key, entry);
	}

	/**
	 * Stores data in Service Worker cache.
	 */
	private setInServiceWorker<T>(key: string, data: T): Observable<void>
	{
		if (!("caches" in window))
		{
			return of(void 0);
		}

		return from(
			caches.open("ngsw:custom:cache").then((cache) =>
			{
				// Convert custom key to a valid URL for Cache API
				// Cache API only accepts http/https URLs, so we need to create a valid URL
				const cacheUrl = this.toCacheUrl(key);

				const response = new Response(JSON.stringify(data), {
					headers: {
						"Content-Type": "application/json",
						"X-Cache-Timestamp": Date.now().toString(),
						"X-Original-Key": key // Store original key for reference
					}
				});
				return cache.put(cacheUrl, response);
			})
		);
	}

	/**
	 * Deletes data from Service Worker cache.
	 */
	private deleteFromServiceWorker(key: string): Observable<boolean>
	{
		if (!("caches" in window))
		{
			return of(false);
		}

		return from(
			caches.open("ngsw:custom:cache").then((cache) =>
			{
				const cacheUrl = this.toCacheUrl(key);
				return cache.delete(cacheUrl);
			})
		);
	}

	/**
	 * Converts a cache key (which may have a custom prefix) to a valid URL for Cache API.
	 * The Cache API only accepts http/https URLs, so we convert custom schemes to valid URLs.
	 *
	 * @param key - Original cache key (e.g., "http-cache://api/weather" or "/api/weather")
	 * @returns Valid URL for Cache API (e.g., "https://app-cache.local/http-cache/api/weather")
	 */
	private toCacheUrl(key: string): string
	{
		// If already a valid http/https URL, use as-is
		if (key.startsWith("http://") || key.startsWith("https://"))
		{
			return key;
		}

		// Handle custom prefix (e.g., "http-cache://api/weather")
		// Convert to a valid URL using a pseudo-domain
		const cleanKey = key.replace(/^[a-z-]+:\/\//, ""); // Remove custom scheme
		return `https://app-cache.local/${cleanKey}`;
	}

	/**
	 * Clears Service Worker cache entries matching pattern.
	 */
	private async clearServiceWorkerPattern(
		pattern: string,
		_prefix: string
	): Promise<void>
	{
		if (!("caches" in window))
		{
			return;
		}

		const cache = await caches.open("ngsw:custom:cache");
		const requests = await cache.keys();

		const deletePromises = requests
			.filter((req) => req.url.includes(pattern))
			.map((req) => cache.delete(req));

		await Promise.all(deletePromises);
	} /**
	 * Clears all Service Worker cache entries.
	 */
	private async clearAllServiceWorker(_prefix: string): Promise<void>
	{
		if (!("caches" in window))
		{
			return;
		}

		const cache = await caches.open("ngsw:custom:cache");
		const requests = await cache.keys();

		const deletePromises = requests
			.filter((req) => req.url.includes(_prefix))
			.map((req) => cache.delete(req));

		await Promise.all(deletePromises);
	}
}
