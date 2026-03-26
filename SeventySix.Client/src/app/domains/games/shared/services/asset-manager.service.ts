import { Injectable } from "@angular/core";
import type { AssetContainer } from "@babylonjs/core/assetContainer";

/**
 * Manages Babylon.js asset loading, caching, and disposal tracking.
 * Caches loaded `AssetContainer` instances by URL to prevent redundant downloads.
 * Tracks all containers for guaranteed cleanup on disposal.
 * @remarks
 * Route-scoped — do NOT use `providedIn`. Register in route `providers[]`.
 * Use `LoadAssetContainerAsync` externally and pass the result to `registerContainer()`.
 */
@Injectable()
export class AssetManagerService
{
	/** Cache of loaded asset containers keyed by source URL. */
	private readonly containerCache: Map<string, AssetContainer> =
		new Map<string, AssetContainer>();

	/**
	 * Number of currently loaded asset containers.
	 */
	public get loadedAssetCount(): number
	{
		return this.containerCache.size;
	}

	/**
	 * Register a loaded asset container for tracking and caching.
	 * If the URL is already cached, the existing container is kept.
	 * @param url - Source URL the container was loaded from.
	 * @param container - The loaded Babylon.js AssetContainer.
	 */
	public registerContainer(
		url: string,
		container: AssetContainer): void
	{
		if (!this.containerCache.has(url))
		{
			this.containerCache.set(url, container);
		}
	}

	/**
	 * Retrieve a cached container by its source URL.
	 * @param url - The URL to look up.
	 * @returns
	 * The cached AssetContainer, or `null` if not found.
	 */
	public getCached(url: string): AssetContainer | null
	{
		return this.containerCache.get(url) ?? null;
	}

	/**
	 * Dispose all tracked asset containers and clear the cache.
	 * Call this when the game scene is being torn down.
	 */
	public disposeAll(): void
	{
		for (const container of this.containerCache.values())
		{
			container.dispose();
		}
		this.containerCache.clear();
	}
}