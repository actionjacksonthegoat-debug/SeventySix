import {
	Directive,
	input,
	effect,
	inject,
	ElementRef,
	Renderer2,
	InputSignal
} from "@angular/core";
import { ViewportService } from "@infrastructure/services";

/**
 * Directive to hide elements on specific breakpoints
 * Usage:
 *   [hideOn]="'mobile'" - hides on mobile devices
 *   [hideOn]="'tablet'" - hides on tablets
 *   [hideOn]="'desktop'" - hides on desktop
 *   [hideOn]="'xsmall'" - hides on xsmall screens
 */
@Directive({
	selector: "[hideOn]"
})
export class HideOnDirective
{
	private viewportService: ViewportService = inject(ViewportService);
	private elementRef: ElementRef = inject(ElementRef);
	private renderer: Renderer2 = inject(Renderer2);

	/**
	 * Breakpoint to hide on
	 */
	hideOn: InputSignal<
		| "mobile"
		| "tablet"
		| "desktop"
		| "xsmall"
		| "small"
		| "medium"
		| "large"
		| "xlarge"
	> = input.required<
		| "mobile"
		| "tablet"
		| "desktop"
		| "xsmall"
		| "small"
		| "medium"
		| "large"
		| "xlarge"
	>();

	constructor()
	{
		effect(() =>
		{
			const breakpoint:
				| "mobile"
				| "tablet"
				| "desktop"
				| "xsmall"
				| "small"
				| "medium"
				| "large"
				| "xlarge" = this.hideOn();
			let shouldHide: boolean = false;

			switch (breakpoint)
			{
				case "mobile":
					shouldHide = this.viewportService.isMobile();
					break;
				case "tablet":
					shouldHide = this.viewportService.isTablet();
					break;
				case "desktop":
					shouldHide = this.viewportService.isDesktop();
					break;
				case "xsmall":
					shouldHide = this.viewportService.isXSmall();
					break;
				case "small":
					shouldHide = this.viewportService.isSmall();
					break;
				case "medium":
					shouldHide = this.viewportService.isMedium();
					break;
				case "large":
					shouldHide = this.viewportService.isLarge();
					break;
				case "xlarge":
					shouldHide = this.viewportService.isXLarge();
					break;
			}

			if (shouldHide)
			{
				this.renderer.setStyle(
					this.elementRef.nativeElement,
					"display",
					"none"
				);
			}
			else
			{
				this.renderer.removeStyle(
					this.elementRef.nativeElement,
					"display"
				);
			}
		});
	}
}

/**
 * Directive to show elements only on specific breakpoints
 * Usage:
 *   [showOn]="'mobile'" - shows only on mobile devices
 *   [showOn]="'tablet'" - shows only on tablets
 *   [showOn]="'desktop'" - shows only on desktop
 */
@Directive({
	selector: "[showOn]"
})
export class ShowOnDirective
{
	private viewportService: ViewportService = inject(ViewportService);
	private elementRef: ElementRef = inject(ElementRef);
	private renderer: Renderer2 = inject(Renderer2);

	/**
	 * Breakpoint to show on
	 */
	showOn: InputSignal<
		| "mobile"
		| "tablet"
		| "desktop"
		| "xsmall"
		| "small"
		| "medium"
		| "large"
		| "xlarge"
	> = input.required<
		| "mobile"
		| "tablet"
		| "desktop"
		| "xsmall"
		| "small"
		| "medium"
		| "large"
		| "xlarge"
	>();

	constructor()
	{
		effect(() =>
		{
			const breakpoint:
				| "mobile"
				| "tablet"
				| "desktop"
				| "xsmall"
				| "small"
				| "medium"
				| "large"
				| "xlarge" = this.showOn();
			let shouldShow: boolean = false;

			switch (breakpoint)
			{
				case "mobile":
					shouldShow = this.viewportService.isMobile();
					break;
				case "tablet":
					shouldShow = this.viewportService.isTablet();
					break;
				case "desktop":
					shouldShow = this.viewportService.isDesktop();
					break;
				case "xsmall":
					shouldShow = this.viewportService.isXSmall();
					break;
				case "small":
					shouldShow = this.viewportService.isSmall();
					break;
				case "medium":
					shouldShow = this.viewportService.isMedium();
					break;
				case "large":
					shouldShow = this.viewportService.isLarge();
					break;
				case "xlarge":
					shouldShow = this.viewportService.isXLarge();
					break;
			}

			if (shouldShow)
			{
				this.renderer.removeStyle(
					this.elementRef.nativeElement,
					"display"
				);
			}
			else
			{
				this.renderer.setStyle(
					this.elementRef.nativeElement,
					"display",
					"none"
				);
			}
		});
	}
}
