import { Injectable } from "@angular/core";
import {
	PreloadingStrategy,
	Route
} from "@angular/router";
import {
	mergeMap,
	Observable,
	of,
	timer
} from "rxjs";

interface NavigatorConnection
{
	saveData?: boolean;
	effectiveType?: string;
}

/**
 * Delay in milliseconds before preloading routes (2 seconds).
 * Allows initial page render to complete before prefetching.
 * @type {number}
 */
const PRELOAD_DELAY_MS: number = 2000;
const MIN_PRELOAD_VIEWPORT_QUERY: string = "(min-width: 960px)";
const SLOW_CONNECTION_TYPES: readonly string[] =
	["slow-2g", "2g", "3g"];

/**
 * Custom Angular PreloadingStrategy for selective route preloading.
 *
 * This strategy enables selective preloading of specific routes while
 * deferring others to on-demand navigation. Routes marked with
 * `data: { preload: true }` will be preloaded after a delay.
 *
 * Usage in route config:
 * ```
 * { path: 'home', component: HomeComponent, data: { preload: true } },
 * { path: 'admin', component: AdminComponent } // not preloaded
 * ```
 *
 * Usage in app.config.ts:
 * ```
 * withPreloading(SelectivePreloadingStrategy)
 * ```
 */
@Injectable(
	{
		providedIn: "root"
	})
export class SelectivePreloadingStrategy implements PreloadingStrategy
{
	/**
	 * Preloads a route if marked with `data: { preload: true }`.
	 * Otherwise defers loading to on-demand navigation.
	 *
	 * @param {Route} route
	 * The route being evaluated.
	 * @param {() => Observable<unknown>} load
	 * Function to trigger the route loading.
	 * @returns {Observable<unknown>}
	 * Observable that emits the loaded module or empty.
	 */
	public preload(
		route: Route,
		load: () => Observable<unknown>): Observable<unknown>
	{
		// Check if route is explicitly marked for preloading
		const shouldPreload: boolean =
			route.data?.["preload"] === true;

		if (!shouldPreload || !this.shouldPreloadForCurrentDevice())
		{
			return of(null);
		}

		// Preload after delay to not block initial render
		return timer(PRELOAD_DELAY_MS)
			.pipe(
				mergeMap(
					() => load()));
	}

	/**
	 * Restrict route preloading to desktop-class devices on capable networks.
	 * Mobile and data-saving connections benefit more from deferring route bundles.
	 *
	 * @returns {boolean}
	 * True when route preloading should run for the current device/network.
	 */
	private shouldPreloadForCurrentDevice(): boolean
	{
		const isDesktopOrLarger: boolean =
			globalThis.matchMedia?.(MIN_PRELOAD_VIEWPORT_QUERY)?.matches ?? true;

		if (!isDesktopOrLarger)
		{
			return false;
		}

		const navigatorConnection: NavigatorConnection | undefined =
			(globalThis.navigator as Navigator & { connection?: NavigatorConnection; })?.connection;

		if (navigatorConnection?.saveData === true)
		{
			return false;
		}

		const effectiveType: string | undefined =
			navigatorConnection?.effectiveType;

		return effectiveType === undefined
			|| !SLOW_CONNECTION_TYPES.includes(effectiveType);
	}
}