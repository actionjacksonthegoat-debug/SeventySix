import { Injectable } from "@angular/core";

/**
 * Utility service that provides thin wrappers around global `window`
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
}
