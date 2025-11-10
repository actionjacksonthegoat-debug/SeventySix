import {
	Directive,
	output,
	OnInit,
	OnDestroy,
	inject,
	PLATFORM_ID
} from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { debounceTime, fromEvent, Subject, takeUntil } from "rxjs";

/**
 * Directive that emits an event when the layout changes (window resize)
 * with a configurable debounce time (default 500ms).
 *
 * Usage:
 * ```html
 * <div appSiteLayoutChanged (layoutChanged)="onLayoutChanged()">
 *   <!-- content -->
 * </div>
 * ```
 */
@Directive({
	selector: "[appSiteLayoutChanged]",
	standalone: true
})
export class SiteLayoutChangedDirective implements OnInit, OnDestroy
{
	private platformId = inject(PLATFORM_ID);
	private destroy$ = new Subject<void>();

	/**
	 * Event emitted when layout change is detected (after debounce)
	 */
	layoutChanged = output<void>();

	/**
	 * Debounce time in milliseconds (default: 500ms)
	 */
	private readonly DEBOUNCE_TIME = 500;

	ngOnInit(): void
	{
		if (!isPlatformBrowser(this.platformId))
		{
			return; // Skip in SSR
		}

		// Listen to window resize events with debounce
		fromEvent(window, "resize")
			.pipe(debounceTime(this.DEBOUNCE_TIME), takeUntil(this.destroy$))
			.subscribe(() =>
			{
				this.layoutChanged.emit();
			});
	}

	ngOnDestroy(): void
	{
		this.destroy$.next();
		this.destroy$.complete();
	}
}
