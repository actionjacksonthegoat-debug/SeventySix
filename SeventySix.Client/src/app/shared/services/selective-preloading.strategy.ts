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

/**
 * Delay in milliseconds before preloading routes (2 seconds).
 * Allows initial page render to complete before prefetching.
 */
const PRELOAD_DELAY_MS: number =
	2000;

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
	 * @param route The route being evaluated
	 * @param load Function to trigger the route loading
	 * @returns Observable that emits the loaded module or empty
	 */
	public preload(
		route: Route,
		load: () => Observable<unknown>): Observable<unknown>
	{
		// Check if route is explicitly marked for preloading
		const shouldPreload: boolean =
			route.data?.['preload'] === true;

		if (!shouldPreload)
		{
			return of(null);
		}

		// Preload after delay to not block initial render
		return timer(PRELOAD_DELAY_MS)
		.pipe(
			mergeMap(
				() =>
					load()));
	}
}
