import { Injectable } from "@angular/core";

/**
 * Utility service for window operations
 * Wraps window methods to make them testable
 */
@Injectable(
	{
		providedIn: "root"
	})
export class WindowUtilities
{
	/**
	 * Reloads the current page
	 */
	reload(): void
	{
		window.location.reload();
	}
}
