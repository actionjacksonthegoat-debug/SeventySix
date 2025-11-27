import { Injectable, inject, computed, Signal } from "@angular/core";
import {
	BreakpointObserver,
	Breakpoints,
	BreakpointState
} from "@angular/cdk/layout";
import { toSignal } from "@angular/core/rxjs-interop";
import { Observable } from "rxjs";

/**
 * Viewport service for responsive design utilities
 * Provides granular breakpoint detection and viewport information
 */
@Injectable({
	providedIn: "root"
})
export class ViewportService
{
	private breakpointObserver: BreakpointObserver = inject(BreakpointObserver);

	/**
	 * Custom breakpoint queries
	 */
	private readonly BREAKPOINTS: { [key: string]: string } = {
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
	private breakpoints$: Observable<BreakpointState> =
		this.breakpointObserver.observe(Object.values(this.BREAKPOINTS));

	/**
	 * Current breakpoint state as signal
	 */
	private breakpointState: Signal<{
		matches: boolean;
		breakpoints: { [key: string]: boolean };
	}> = toSignal(this.breakpoints$, {
		initialValue: { matches: false, breakpoints: {} }
	});

	/**
	 * Breakpoint detection signals
	 */
	isXSmall: Signal<boolean> = computed(() =>
	{
		const bp: { [key: string]: boolean } = this.breakpointState()
			.breakpoints as {
			[key: string]: boolean;
		};
		return !!bp[this.BREAKPOINTS["xsmall"]];
	});

	isSmall: Signal<boolean> = computed(() =>
	{
		const bp: { [key: string]: boolean } = this.breakpointState()
			.breakpoints as {
			[key: string]: boolean;
		};
		return !!bp[this.BREAKPOINTS["small"]];
	});

	isMedium: Signal<boolean> = computed(() =>
	{
		const bp: { [key: string]: boolean } = this.breakpointState()
			.breakpoints as {
			[key: string]: boolean;
		};
		return !!bp[this.BREAKPOINTS["medium"]];
	});

	isLarge: Signal<boolean> = computed(() =>
	{
		const bp: { [key: string]: boolean } = this.breakpointState()
			.breakpoints as {
			[key: string]: boolean;
		};
		return !!bp[this.BREAKPOINTS["large"]];
	});

	isXLarge: Signal<boolean> = computed(() =>
	{
		const bp: { [key: string]: boolean } = this.breakpointState()
			.breakpoints as {
			[key: string]: boolean;
		};
		return !!bp[this.BREAKPOINTS["xlarge"]];
	});

	isHandset: Signal<boolean> = computed(() =>
	{
		const bp: { [key: string]: boolean } = this.breakpointState()
			.breakpoints as {
			[key: string]: boolean;
		};
		return !!bp[Breakpoints.Handset];
	});

	isTablet: Signal<boolean> = computed(() =>
	{
		const bp: { [key: string]: boolean } = this.breakpointState()
			.breakpoints as {
			[key: string]: boolean;
		};
		return !!bp[Breakpoints.Tablet];
	});

	isWeb: Signal<boolean> = computed(() =>
	{
		const bp: { [key: string]: boolean } = this.breakpointState()
			.breakpoints as {
			[key: string]: boolean;
		};
		return !!bp[Breakpoints.Web];
	});

	isHandsetPortrait: Signal<boolean> = computed(() =>
	{
		const bp: { [key: string]: boolean } = this.breakpointState()
			.breakpoints as {
			[key: string]: boolean;
		};
		return !!bp[Breakpoints.HandsetPortrait];
	});

	isHandsetLandscape: Signal<boolean> = computed(() =>
	{
		const bp: { [key: string]: boolean } = this.breakpointState()
			.breakpoints as {
			[key: string]: boolean;
		};
		return !!bp[Breakpoints.HandsetLandscape];
	});

	isTabletPortrait: Signal<boolean> = computed(() =>
	{
		const bp: { [key: string]: boolean } = this.breakpointState()
			.breakpoints as {
			[key: string]: boolean;
		};
		return !!bp[Breakpoints.TabletPortrait];
	});

	isTabletLandscape: Signal<boolean> = computed(() =>
	{
		const bp: { [key: string]: boolean } = this.breakpointState()
			.breakpoints as {
			[key: string]: boolean;
		};
		return !!bp[Breakpoints.TabletLandscape];
	});

	/**
	 * Convenience computed values
	 */
	isMobile: Signal<boolean> = computed(() => this.isHandset());

	isDesktop: Signal<boolean> = computed(() => this.isWeb());

	isTouchDevice: Signal<boolean> = computed(
		() => this.isHandset() || this.isTablet()
	); /**
	 * Get current breakpoint name
	 */
	currentBreakpoint: Signal<string> = computed(() =>
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
	deviceType: Signal<string> = computed(() =>
	{
		if (this.isHandset()) return "handset";
		if (this.isTablet()) return "tablet";
		if (this.isWeb()) return "desktop";
		return "unknown";
	});

	/**
	 * Get current orientation
	 */
	orientation: Signal<string> = computed(() =>
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
