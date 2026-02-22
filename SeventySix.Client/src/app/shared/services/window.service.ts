// <copyright file="window.service.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import {
	Injectable
} from "@angular/core";

/**
 * Service that provides wrappers around global `window`
 * functionality to make usage easier to stub in tests.
 *
 * Provided in the root injector so it can be injected wherever window
 * operations are required.
 */
@Injectable(
	{
		providedIn: "root"
	})
export class WindowService
{
	/**
	 * Reloads the current page using `window.location.reload()`.
	 * @returns {void}
	 * Triggers a page reload.
	 */
	reload(): void
	{
		window.location.reload();
	}

	/**
	 * Navigates to a URL using `window.location.href`.
	 * @param {string} url
	 * The URL to navigate to.
	 * @returns {void}
	 */
	navigateTo(url: string): void
	{
		window.location.href = url;
	}

	/**
	 * Gets the current URL.
	 * @returns {string}
	 * The current window location href.
	 */
	getCurrentUrl(): string
	{
		return window.location.href;
	}

	/**
	 * Gets the current pathname.
	 * @returns {string}
	 * The current window location pathname.
	 */
	getPathname(): string
	{
		return window.location.pathname;
	}

	/**
	 * Gets the viewport inner height.
	 * @returns {number}
	 * The window inner height.
	 */
	getViewportHeight(): number
	{
		return window.innerHeight;
	}

	/**
	 * Gets the viewport inner width.
	 * @returns {number}
	 * The window inner width.
	 */
	getViewportWidth(): number
	{
		return window.innerWidth;
	}

	/**
	 * Opens a URL in a new browser tab/window.
	 * @param {string} url
	 * The URL to open.
	 * @param {string} target
	 * The target window name (default: '_blank').
	 * @returns {Window | null}
	 * The opened window reference, or null if blocked.
	 */
	openWindow(
		url: string,
		target: string = "_blank"): Window | null
	{
		return window.open(url, target);
	}

	/**
	 * Scrolls the window to the top.
	 * @returns {void}
	 */
	scrollToTop(): void
	{
		window.scrollTo(0, 0);
	}

	/**
	 * Gets the hash portion of the current URL.
	 *
	 * @returns
	 * The hash string including the '#' character.
	 */
	getHash(): string
	{
		return window.location.hash;
	}

	/**
	 * Gets the search/query portion of the current URL.
	 *
	 * @returns
	 * The search string including the '?' character.
	 */
	getSearch(): string
	{
		return window.location.search;
	}

	/**
	 * Replaces the current history state without navigation.
	 *
	 * @param data
	 * State object to associate with the new history entry.
	 *
	 * @param unused
	 * Unused parameter (required by History API).
	 *
	 * @param url
	 * The new URL to display.
	 */
	replaceState(
		data: unknown,
		unused: string,
		url: string): void
	{
		window.history.replaceState(
			data,
			unused,
			url);
	}
}