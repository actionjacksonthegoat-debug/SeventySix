import {
	Injectable
} from "@angular/core";

/**
 * Utility service that provides wrappers around global `window`
 * functionality to make usage easier to stub in tests.
 *
 * Provided in the root injector so it can be injected wherever window
 * operations are required.
 */
@Injectable(
	{
		providedIn: "root"
	})
export class WindowUtilities
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
}
