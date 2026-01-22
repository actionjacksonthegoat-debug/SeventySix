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
	getStandardTableOffset
} from "@shared/constants";
import { fromEvent } from "rxjs";
import { debounceTime } from "rxjs/operators";

/**
 * Directive to automatically calculate and apply table height based on available viewport space
 *
 * Automatically calculates the available screen height for table content by:
 * 1. Measuring the element's distance from the viewport top
 * 2. Subtracting standard table component heights (120px at density -1)
 * 3. Applying a minimum height constraint (default: 400px)
 * 4. Updating on window resize events with 500ms debounce
 *
 * The directive always accounts for these table components at Material Design density -1:
 * - Search toolbar (72px): mat-form-field + padding
 * - Filter chips toolbar (48px): chip row + padding
 * - Total offset: 120px
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
	 * 1. Get element's top position within viewport
	 * 2. Subtract standard table offset (120px for search + filters at density -1)
	 * 3. Calculate available height: viewport height - element top - offset
	 * 4. Apply minimum height constraint
	 *
	 * The offset accounts for:
	 * - Search toolbar (72px at density -1)
	 * - Filter chips toolbar (48px at density -1)
	 * - Total: 120px
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

		// Use shared constant for standard table offset (120px)
		const offset: number =
			getStandardTableOffset();

		// Calculate available height: viewport - element top - offset for table components
		const adjustedHeight: number =
			window.innerHeight - elementTopPosition - offset;

		const minHeight: number =
			minHeightOverride ?? this.appTableHeight();
		const finalHeight: number =
			Math.max(minHeight, adjustedHeight);

		this.renderer.setStyle(element, "height", `${finalHeight}px`);

		// Also update min-height for consistency
		this.renderer.setStyle(element, "min-height", `${minHeight}px`);
	}
}
