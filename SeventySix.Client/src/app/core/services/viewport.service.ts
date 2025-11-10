import { Injectable, inject, computed } from "@angular/core";
import { BreakpointObserver, Breakpoints } from "@angular/cdk/layout";
import { toSignal } from "@angular/core/rxjs-interop";

/**
 * Viewport service for responsive design utilities
 * Provides granular breakpoint detection and viewport information
 */
@Injectable({
	providedIn: "root"
})
export class ViewportService
{
	private breakpointObserver = inject(BreakpointObserver);

	/**
	 * Custom breakpoint queries
	 */
	private readonly BREAKPOINTS = {
		xsmall: "(max-width: 599px)",
		small: "(min-width: 600px) and (max-width: 959px)",
		medium: "(min-width: 960px) and (max-width: 1279px)",
		large: "(min-width: 1280px) and (max-width: 1919px)",
		xlarge: "(min-width: 1920px)",
		handset: Breakpoints.Handset,
		tablet: Breakpoints.Tablet,
		web: Breakpoints.Web,
		handsetPortrait: Breakpoints.HandsetPortrait,
		handsetLandscape: Breakpoints.HandsetLandscape,
		tabletPortrait: Breakpoints.TabletPortrait,
		tabletLandscape: Breakpoints.TabletLandscape
	};

	/**
	 * Observe all breakpoints
	 */
	private breakpoints$ = this.breakpointObserver.observe(
		Object.values(this.BREAKPOINTS)
	);

	/**
	 * Current breakpoint state as signal
	 */
	private breakpointState = toSignal(this.breakpoints$, {
		initialValue: { matches: false, breakpoints: {} }
	});

	/**
	 * Breakpoint detection signals
	 */
	isXSmall = computed(() =>
	{
		const bp = this.breakpointState().breakpoints as {
			[key: string]: boolean;
		};
		return !!bp[this.BREAKPOINTS.xsmall];
	});

	isSmall = computed(() =>
	{
		const bp = this.breakpointState().breakpoints as {
			[key: string]: boolean;
		};
		return !!bp[this.BREAKPOINTS.small];
	});

	isMedium = computed(() =>
	{
		const bp = this.breakpointState().breakpoints as {
			[key: string]: boolean;
		};
		return !!bp[this.BREAKPOINTS.medium];
	});

	isLarge = computed(() =>
	{
		const bp = this.breakpointState().breakpoints as {
			[key: string]: boolean;
		};
		return !!bp[this.BREAKPOINTS.large];
	});

	isXLarge = computed(() =>
	{
		const bp = this.breakpointState().breakpoints as {
			[key: string]: boolean;
		};
		return !!bp[this.BREAKPOINTS.xlarge];
	});

	isHandset = computed(() =>
	{
		const bp = this.breakpointState().breakpoints as {
			[key: string]: boolean;
		};
		return !!bp[Breakpoints.Handset];
	});

	isTablet = computed(() =>
	{
		const bp = this.breakpointState().breakpoints as {
			[key: string]: boolean;
		};
		return !!bp[Breakpoints.Tablet];
	});

	isWeb = computed(() =>
	{
		const bp = this.breakpointState().breakpoints as {
			[key: string]: boolean;
		};
		return !!bp[Breakpoints.Web];
	});

	isHandsetPortrait = computed(() =>
	{
		const bp = this.breakpointState().breakpoints as {
			[key: string]: boolean;
		};
		return !!bp[Breakpoints.HandsetPortrait];
	});

	isHandsetLandscape = computed(() =>
	{
		const bp = this.breakpointState().breakpoints as {
			[key: string]: boolean;
		};
		return !!bp[Breakpoints.HandsetLandscape];
	});

	isTabletPortrait = computed(() =>
	{
		const bp = this.breakpointState().breakpoints as {
			[key: string]: boolean;
		};
		return !!bp[Breakpoints.TabletPortrait];
	});

	isTabletLandscape = computed(() =>
	{
		const bp = this.breakpointState().breakpoints as {
			[key: string]: boolean;
		};
		return !!bp[Breakpoints.TabletLandscape];
	});

	/**
	 * Convenience computed values
	 */
	isMobile = computed(() => this.isHandset());

	isDesktop = computed(() => this.isWeb());

	isTouchDevice = computed(() => this.isHandset() || this.isTablet());

	/**
	 * Get current breakpoint name
	 */
	currentBreakpoint = computed(() =>
	{
		if (this.isXSmall()) return "xsmall";
		if (this.isSmall()) return "small";
		if (this.isMedium()) return "medium";
		if (this.isLarge()) return "large";
		if (this.isXLarge()) return "xlarge";
		return "unknown";
	});

	/**
	 * Get current device type
	 */
	deviceType = computed(() =>
	{
		if (this.isHandset()) return "handset";
		if (this.isTablet()) return "tablet";
		if (this.isWeb()) return "desktop";
		return "unknown";
	});

	/**
	 * Get current orientation
	 */
	orientation = computed(() =>
	{
		if (this.isHandsetPortrait() || this.isTabletPortrait())
		{
			return "portrait";
		}
		if (this.isHandsetLandscape() || this.isTabletLandscape())
		{
			return "landscape";
		}
		return "unknown";
	});

	/**
	 * Check if specific breakpoint matches
	 */
	matches(query: string): boolean
	{
		return this.breakpointObserver.isMatched(query);
	}
}
