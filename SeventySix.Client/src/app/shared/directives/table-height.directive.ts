import {
	afterNextRender,
	Directive,
	effect,
	ElementRef,
	inject,
	input,
	InputSignal,
	Renderer2,
	untracked
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
	DEBOUNCE_TIME,
	TABLE_BOTTOM_MARGIN
} from "@shared/constants";
import { fromEvent } from "rxjs";
import { debounceTime } from "rxjs/operators";

/**
 * Directive to automatically calculate and apply table height based on available viewport space
 *
 * Automatically calculates the available screen height for table content by:
 * 1. Measuring the element's distance from the viewport top (getBoundingClientRect().top)
 * 2. Subtracting a small bottom margin for paginator and page chrome
 * 3. Applying a minimum height constraint (default: 400px)
 * 4. Updating on window resize events with 500ms debounce
 *
 * The element's top position already accounts for all content above it (toolbars,
 * headers, nav bars) so no fixed toolbar offset is needed.
 *
 * Usage:
 *   <cdk-virtual-scroll-viewport appTableHeight>
 *   <cdk-virtual-scroll-viewport [appTableHeight]="500"> <!-- custom min-height -->
 *
 * @example
 * // Standard table with default 400px minimum height
 * <cdk-virtual-scroll-viewport appTableHeight [itemSize]="48">
 *   <table mat-table [dataSource]="data">...</table>
 * </cdk-virtual-scroll-viewport>
 *
 * @example
 * // Custom minimum height
 * <cdk-virtual-scroll-viewport [appTableHeight]="600" [itemSize]="48">
 *   <table mat-table [dataSource]="data">...</table>
 * </cdk-virtual-scroll-viewport>
 */
@Directive(
	{
		selector: "[appTableHeight]"
	})
export class TableHeightDirective
{
	/**
	 * Minimum height for the table in pixels
	 * Default: 400px
	 */
	readonly appTableHeight: InputSignal<number> =
		input<number>(400,
			{
				alias: "appTableHeight"
			});

	/**
	 * Element reference for DOM manipulation
	 */
	private readonly elementRef: ElementRef =
		inject(ElementRef);

	/**
	 * Renderer for safe DOM manipulation
	 */
	private readonly renderer: Renderer2 =
		inject(Renderer2);

	constructor()
	{
		// CLS Prevention: Apply min-height synchronously before first render
		this.applyInitialHeight();

		// Calculate actual height after element is rendered in DOM
		afterNextRender(
			() =>
			{
				this.updateHeight();
			});

		// Listen to window resize events (zoneless compatible)
		// Debounced to handle scenarios with hundreds of directives on same page
		fromEvent(window, "resize")
			.pipe(debounceTime(DEBOUNCE_TIME.RESIZE_EVENT), takeUntilDestroyed())
			.subscribe(
				() =>
				{
					this.updateHeight();
				});

		// Update height when inputs change
		// Effect runs immediately on change (no debounce needed for input changes)
		// Uses untracked() to prevent signal tracking on the updateHeight call
		effect(
			() =>
			{
				const minHeight: number =
					this.appTableHeight();
				untracked(
					() => this.updateHeight(minHeight));
			});
	}

	/**
	 * Apply min-height synchronously on initialization to prevent CLS
	 *
	 * This method sets the min-height BEFORE Angular's first change detection,
	 * ensuring the table reserves its minimum space immediately.
	 * Prevents Cumulative Layout Shift (CLS) caused by table content loading.
	 */
	private applyInitialHeight(): void
	{
		const element: HTMLElement =
			this.elementRef.nativeElement;
		const minHeight: number =
			this.appTableHeight();
		this.renderer.setStyle(element, "min-height", `${minHeight}px`);
	}

	/**
	 * Calculate and apply height based on available viewport space
	 *
	 * Algorithm:
	 * 1. Get element's top position within viewport (rect.top already includes
	 *    all content rendered above the element — toolbars, headers, nav bars)
	 * 2. Calculate available height: viewport height - element top - bottom margin
	 * 3. Apply minimum height constraint
	 *
	 * Performance Note:
	 * With 500ms debounce, even with hundreds of tables on the page,
	 * calculations happen only once every half second during resize.
	 * @param {number} minHeightOverride
	 * Optional minimum height override from input signal.
	 * @returns {void}
	 */
	private updateHeight(minHeightOverride?: number): void
	{
		const element: HTMLElement =
			this.elementRef.nativeElement;
		const rect: DOMRect =
			element.getBoundingClientRect();
		const elementTopPosition: number =
			rect.top;

		// Available height = viewport height - element's top position - bottom margin
		// rect.top already accounts for all content above the element (toolbars, headers, etc.)
		const adjustedHeight: number =
			window.innerHeight - elementTopPosition - TABLE_BOTTOM_MARGIN;

		const minHeight: number =
			minHeightOverride ?? this.appTableHeight();
		const finalHeight: number =
			Math.max(minHeight, adjustedHeight);

		this.renderer.setStyle(element, "height", `${finalHeight}px`);

		// Also update min-height for consistency
		this.renderer.setStyle(element, "min-height", `${minHeight}px`);
	}
}
