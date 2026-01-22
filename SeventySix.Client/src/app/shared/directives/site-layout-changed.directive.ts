import { isPlatformBrowser } from "@angular/common";
import {
	DestroyRef,
	Directive,
	inject,
	OnInit,
	output,
	OutputEmitterRef,
	PLATFORM_ID
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { DEBOUNCE_TIME } from "@shared/constants";
import { debounceTime, fromEvent } from "rxjs";

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
@Directive(
	{
		selector: "[appSiteLayoutChanged]"
	})
export class SiteLayoutChangedDirective implements OnInit
{
	private readonly platformId: Object =
		inject(PLATFORM_ID);
	private readonly destroyRef: DestroyRef =
		inject(DestroyRef);

	/**
	 * Event emitted when layout change is detected (after debounce)
	 */
	readonly layoutChanged: OutputEmitterRef<void> =
		output<void>();

	ngOnInit(): void
	{
		if (!isPlatformBrowser(this.platformId))
		{
			return; // Skip in SSR
		}

		// Listen to window resize events with debounce
		fromEvent(window, "resize")
			.pipe(
				debounceTime(DEBOUNCE_TIME.RESIZE_EVENT),
				takeUntilDestroyed(this.destroyRef))
			.subscribe(
				() =>
				{
					this.layoutChanged.emit();
				});
	}
}
