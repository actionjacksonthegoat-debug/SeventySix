import {
	afterNextRender,
	Directive,
	ElementRef,
	inject,
	OnDestroy
} from "@angular/core";
import { MatTooltip } from "@angular/material/tooltip";

/**
 * Field message directive — truncates hint/error text to a single line with ellipsis
 * and shows a Material tooltip with the full message only when text is clipped.
 *
 * Applies to both `mat-hint` and `mat-error` elements. Tooltip activates automatically
 * only when `scrollWidth > clientWidth` (i.e. text is actually truncated).
 * Touch gestures are enabled for mobile tap-to-reveal support.
 *
 * Uses `afterNextRender` to defer DOM measurement until after the first render,
 * avoiding `ExpressionChangedAfterItHasBeenCheckedError` from modifying
 * `MatTooltip.disabled` inside change detection.
 *
 * @example
 * <mat-hint appFieldMessage>At least 8 characters with uppercase, lowercase, and a digit</mat-hint>
 * <mat-error appFieldMessage>{{ errorMessage() }}</mat-error>
 */
@Directive(
	{
		selector: "[appFieldMessage]",
		hostDirectives: [MatTooltip],
		host: {
			style: "display: block; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;",
			"(mouseleave)": "hideTooltip()",
			"(blur)": "hideTooltip()",
			"(touchend)": "onTouchEnd()"
		}
	})
export class FieldMessageDirective implements OnDestroy
{
	/**
	 * Reference to the host DOM element for truncation measurement.
	 * @type {ElementRef<HTMLElement>}
	 * @private
	 * @readonly
	 */
	private readonly elementRef: ElementRef<HTMLElement> =
		inject(ElementRef);

	/**
	 * The composed MatTooltip instance. Populated via `hostDirectives` injection.
	 * @type {MatTooltip}
	 * @private
	 * @readonly
	 */
	private readonly tooltip: MatTooltip =
		inject(MatTooltip);

	/**
	 * ResizeObserver that re-evaluates truncation state when the host is resized.
	 * Null before the first render or after destroy.
	 * @type {ResizeObserver | null}
	 * @private
	 */
	private resizeObserver: ResizeObserver | null = null;

	constructor()
	{
		afterNextRender(
			() =>
			{
				this.tooltip.message =
					this.elementRef.nativeElement.textContent?.trim() ?? "";
				this.tooltip.touchGestures = "on";

				this.resizeObserver =
					new ResizeObserver(
						() =>
						{
							this.updateTooltipState();
						});

				this.resizeObserver.observe(this.elementRef.nativeElement);

				// Defer the initial disabled check to the next microtask to avoid
				// ExpressionChangedAfterItHasBeenCheckedError in development mode.
				// ResizeObserver handles all subsequent updates.
				queueMicrotask(
					() =>
					{
						this.updateTooltipState();
					});
			});
	}

	ngOnDestroy(): void
	{
		this.resizeObserver?.disconnect();
		this.resizeObserver = null;
	}

	/**
	 * Hides the tooltip explicitly.
	 * Called on mouseleave and blur to ensure the tooltip collapses
	 * back to the single-line ellipsis layout.
	 */
	hideTooltip(): void
	{
		this.tooltip.hide(0);
	}

	/**
	 * Handles touchend — hides the tooltip on a second tap if it is currently visible.
	 * The first tap is handled by MatTooltip.touchGestures="on".
	 * This ensures mobile users can dismiss the tooltip without navigating away.
	 */
	onTouchEnd(): void
	{
		if (this.tooltip._isTooltipVisible())
		{
			this.tooltip.hide(0);
		}
	}

	/**
	 * Enables or disables the tooltip based on whether the text is visually clipped.
	 * Tooltip is disabled as long as the full text fits within the available width.
	 */
	private updateTooltipState(): void
	{
		const el: HTMLElement =
			this.elementRef.nativeElement;
		this.tooltip.disabled =
			el.scrollWidth <= el.clientWidth;
	}
}