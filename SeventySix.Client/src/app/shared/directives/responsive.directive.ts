import {
	Directive,
	input,
	effect,
	inject,
	ElementRef,
	Renderer2
} from "@angular/core";
import { ViewportService } from "@core/services";

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
	private viewportService = inject(ViewportService);
	private elementRef = inject(ElementRef);
	private renderer = inject(Renderer2);

	/**
	 * Breakpoint to hide on
	 */
	hideOn = input.required<
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
			const breakpoint = this.hideOn();
			let shouldHide = false;

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
	private viewportService = inject(ViewportService);
	private elementRef = inject(ElementRef);
	private renderer = inject(Renderer2);

	/**
	 * Breakpoint to show on
	 */
	showOn = input.required<
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
			const breakpoint = this.showOn();
			let shouldShow = false;

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
