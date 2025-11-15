import { Injectable, signal } from "@angular/core";
import {
	Router,
	NavigationStart,
	NavigationEnd,
	NavigationCancel,
	NavigationError
} from "@angular/router";
import { filter } from "rxjs/operators";

/**
 * Loading indicator service.
 * Manages global loading state for route transitions.
 * Integrates with Material progress bar component.
 */
@Injectable({
	providedIn: "root"
})
export class LoadingService
{
	/**
	 * Global loading state signal
	 */
	readonly isLoading: ReturnType<typeof signal<boolean>> =
		signal<boolean>(false);

	constructor(private router: Router)
	{
		// Subscribe to router events
		this.router.events
			.pipe(
				filter(
					(event) =>
						event instanceof NavigationStart ||
						event instanceof NavigationEnd ||
						event instanceof NavigationCancel ||
						event instanceof NavigationError
				)
			)
			.subscribe((event) =>
			{
				if (event instanceof NavigationStart)
				{
					this.show();
				}
				else if (
					event instanceof NavigationEnd ||
					event instanceof NavigationCancel ||
					event instanceof NavigationError
				)
				{
					this.hide();
				}
			});
	}

	/**
	 * Show loading indicator
	 */
	show(): void
	{
		this.isLoading.set(true);
	}

	/**
	 * Hide loading indicator
	 */
	hide(): void
	{
		this.isLoading.set(false);
	}
}
