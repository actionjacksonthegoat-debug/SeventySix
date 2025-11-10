import { Injectable } from "@angular/core";

/**
 * Cache configuration from ngsw-config.json dataGroups.
 */
interface DataGroup
{
	name: string;
	urls: string[];
	cacheConfig: {
		strategy: "freshness" | "performance";
		maxSize: number;
		maxAge: string;
		timeout?: string;
	};
}

/**
 * Service Worker configuration structure from ngsw-config.json.
 */
interface NgswConfig
{
	dataGroups?: DataGroup[];
}

/**
 * Service that provides cache TTL configuration by reading from ngsw-config.json.
 * This ensures a single source of truth for cache times across the application.
 *
 * The service reads the dataGroups from ngsw-config.json and provides methods
 * to get cache TTL values based on URL patterns.
 *
 * This service is zoneless-compatible and uses native fetch API.
 */
@Injectable({
	providedIn: "root"
})
export class CacheConfigService
{
	private dataGroups: DataGroup[] = [];
	private readonly defaultTtl = 5 * 60 * 1000; // 5 minutes default
	private configLoaded = false;
	private configPromise: Promise<void> | null = null;

	constructor()
	{
		// Start loading config immediately using native fetch (zoneless-compatible)
		this.configPromise = this.loadConfig();
	}

	/**
	 * Loads the ngsw-config.json file dynamically from the server using native fetch.
	 * This ensures a single source of truth for cache configuration.
	 * Uses fetch API to be compatible with zoneless Angular.
	 */
	private async loadConfig(): Promise<void>
	{
		try
		{
			const response = await fetch("/ngsw-config.json");

			if (!response.ok)
			{
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const config: NgswConfig = await response.json();

			if (config.dataGroups)
			{
				this.dataGroups = config.dataGroups;
			}

			this.configLoaded = true;
		}
		catch (error)
		{
			console.error(
				"Failed to load ngsw-config.json, using defaults:",
				error
			);
			// Fallback to minimal defaults if config fails to load
			this.dataGroups = [
				{
					name: "api-default",
					urls: ["/api/**"],
					cacheConfig: {
						strategy: "freshness",
						maxSize: 100,
						maxAge: "5m"
					}
				}
			];
			this.configLoaded = true;
		}
	}

	/**
	 * Ensures config is loaded before proceeding.
	 * This is called internally by public methods.
	 */
	private async ensureConfigLoaded(): Promise<void>
	{
		if (!this.configLoaded && this.configPromise)
		{
			await this.configPromise;
		}
	}

	/**
	 * Gets the cache TTL for a given URL based on ngsw-config.json dataGroups.
	 * Matches the URL against configured patterns and returns the maxAge in milliseconds.
	 *
	 * @param url - The URL to get cache TTL for
	 * @returns Cache TTL in milliseconds
	 */
	getTtl(url: string): number
	{
		// Synchronous access - config should already be loaded
		// If not loaded yet, return default (config loads in constructor)
		if (!this.configLoaded)
		{
			return this.defaultTtl;
		}

		// Find the first matching dataGroup
		for (const group of this.dataGroups)
		{
			if (this.urlMatchesPattern(url, group.urls))
			{
				return this.parseMaxAge(group.cacheConfig.maxAge);
			}
		}

		// Return default if no match
		return this.defaultTtl;
	}

	/**
	 * Gets the cache TTL for a given URL (async version that waits for config).
	 * Use this if you need to guarantee the config is loaded.
	 *
	 * @param url - The URL to get cache TTL for
	 * @returns Promise resolving to cache TTL in milliseconds
	 */
	async getTtlAsync(url: string): Promise<number>
	{
		await this.ensureConfigLoaded();
		return this.getTtl(url);
	}

	/**
	 * Gets the cache strategy for a given URL.
	 *
	 * @param url - The URL to get cache strategy for
	 * @returns Cache strategy ('freshness' or 'performance')
	 */
	getStrategy(url: string): "freshness" | "performance"
	{
		if (!this.configLoaded)
		{
			return "freshness";
		}

		for (const group of this.dataGroups)
		{
			if (this.urlMatchesPattern(url, group.urls))
			{
				return group.cacheConfig.strategy;
			}
		}

		return "freshness"; // Default strategy
	}

	/**
	 * Gets the timeout for a given URL (if specified in config).
	 *
	 * @param url - The URL to get timeout for
	 * @returns Timeout in milliseconds, or undefined if not specified
	 */
	getTimeout(url: string): number | undefined
	{
		if (!this.configLoaded)
		{
			return undefined;
		}

		for (const group of this.dataGroups)
		{
			if (this.urlMatchesPattern(url, group.urls))
			{
				const timeout = group.cacheConfig.timeout;
				return timeout ? this.parseMaxAge(timeout) : undefined;
			}
		}

		return undefined;
	}

	/**
	 * Waits for the configuration to be fully loaded.
	 * Useful if you need to ensure config is available before proceeding.
	 */
	async waitForConfig(): Promise<void>
	{
		await this.ensureConfigLoaded();
	}

	/**
	 * Checks if the configuration has been loaded.
	 */
	isConfigLoaded(): boolean
	{
		return this.configLoaded;
	}

	/**
	 * Checks if a URL matches any of the patterns in the array.
	 * Supports glob patterns like /api/weather/** and exact matches.
	 *
	 * @param url - URL to check
	 * @param patterns - Array of URL patterns to match against
	 * @returns True if URL matches any pattern
	 */
	private urlMatchesPattern(url: string, patterns: string[]): boolean
	{
		return patterns.some((pattern) =>
		{
			// Convert glob pattern to regex
			// Replace ** with .* and * with [^/]*
			const regexPattern = pattern
				.replace(/\*\*/g, ".*") // ** matches anything
				.replace(/\*/g, "[^/]*") // * matches anything except /
				.replace(/\//g, "\\/"); // Escape forward slashes

			const regex = new RegExp(`^${regexPattern}$`);
			return regex.test(url);
		});
	}

	/**
	 * Parses maxAge string from ngsw-config format to milliseconds.
	 * Supports formats like: 5m, 1h, 30s, 2d
	 *
	 * @param maxAge - maxAge string (e.g., "5m", "1h")
	 * @returns Time in milliseconds
	 */
	private parseMaxAge(maxAge: string): number
	{
		const match = maxAge.match(/^(\d+)([smhd])$/);

		if (!match)
		{
			console.warn(`Invalid maxAge format: ${maxAge}, using default`);
			return this.defaultTtl;
		}

		const value = parseInt(match[1], 10);
		const unit = match[2];

		switch (unit)
		{
			case "s":
				return value * 1000; // seconds
			case "m":
				return value * 60 * 1000; // minutes
			case "h":
				return value * 60 * 60 * 1000; // hours
			case "d":
				return value * 24 * 60 * 60 * 1000; // days
			default:
				return this.defaultTtl;
		}
	}

	/**
	 * Gets all configured data groups.
	 * Useful for debugging or displaying cache configuration.
	 */
	getDataGroups(): DataGroup[]
	{
		return [...this.dataGroups];
	}

	/**
	 * Gets the default TTL used when no pattern matches.
	 */
	getDefaultTtl(): number
	{
		return this.defaultTtl;
	}
}
