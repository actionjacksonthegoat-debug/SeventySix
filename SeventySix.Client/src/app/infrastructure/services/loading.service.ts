import { inject, Injectable, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
	NavigationCancel,
	NavigationEnd,
	NavigationError,
	NavigationStart,
	Router
} from "@angular/router";
import { filter } from "rxjs/operators";

/**
 * Loading indicator service.
 * Manages global loading state for route transitions.
 * Integrates with Material progress bar component.
 */
@Injectable(
	{
		providedIn: "root"
	})
export class LoadingService
{
	private readonly router: Router =
		inject(Router);

	/**
	 * Global loading state signal
	 */
	readonly isLoading: ReturnType<typeof signal<boolean>> =
		signal<boolean>(false);

	constructor()
	{
		// Subscribe to router events with automatic cleanup
		this
		.router
		.events
		.pipe(
			filter(
				(event) =>
					event instanceof NavigationStart
						|| event instanceof NavigationEnd
						|| event instanceof NavigationCancel
						|| event instanceof NavigationError),
			takeUntilDestroyed())
		.subscribe(
			(event) =>
			{
				if (event instanceof NavigationStart)
				{
					this.show();
				}
				else if (
					event instanceof NavigationEnd
						|| event instanceof NavigationCancel
						|| event instanceof NavigationError)
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
