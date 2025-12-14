import {
	BreakpointObserver,
	Breakpoints,
	BreakpointState
} from "@angular/cdk/layout";
import {
	computed,
	inject,
	Injectable,
	PLATFORM_ID,
	signal
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { isNullOrUndefined } from "@infrastructure/utils/null-check.utility";

/**
 * Service for managing application layout state
 * Handles sidebar expansion, responsive breakpoints, and layout preferences
 */
@Injectable(
	{
		providedIn: "root"
	})
export class LayoutService
{
	private platformId: Object =
		inject(PLATFORM_ID);
	private breakpointObserver: BreakpointObserver =
		inject(BreakpointObserver);
	private readonly SIDEBAR_SESSION_KEY: string = "seventysix-sidebar-session";

	/**
	 * Sidebar expanded state
	 * Always starts open on fresh page load/refresh
	 * Only persists closed state within the same session
	 */
	sidebarExpanded: ReturnType<typeof signal<boolean>> =
		signal<boolean>(
			this.getSessionSidebarState());

	/**
	 * Observe responsive breakpoints
	 * Using Angular CDK Breakpoints constants:
	 * - XSmall: (max-width: 599.98px) - Mobile phones
	 * - Small: (min-width: 600px) and (max-width: 959.98px) - Tablets
	 * - Medium and above: (min-width: 960px) - Laptop and desktop
	 */
	private breakpoints$: ReturnType<typeof this.breakpointObserver.observe> =
		this.breakpointObserver.observe(
			[
				Breakpoints.XSmall, // (max-width: 599.98px)
				Breakpoints.Small, // (min-width: 600px) and (max-width: 959.98px)
				Breakpoints.Medium, // (min-width: 960px) and (max-width: 1279.98px)
				Breakpoints.Large, // (min-width: 1280px) and (max-width: 1919.98px)
				Breakpoints.XLarge // (min-width: 1920px)
			]);

	breakpoints: ReturnType<typeof toSignal<BreakpointState>> =
		toSignal(
			this.breakpoints$,
			{
				initialValue: { matches: false, breakpoints: {} }
			});

	/**
	 * Computed values for responsive behavior
	 */
	isMobile: ReturnType<typeof computed<boolean>> =
		computed(
			() =>
			{
				const bp: { [key: string]: boolean; } =
					this
					.breakpoints()
					.breakpoints as { [key: string]: boolean; };
				return !!bp[Breakpoints.XSmall];
			});

	isTablet: ReturnType<typeof computed<boolean>> =
		computed(
			() =>
			{
				const bp: { [key: string]: boolean; } =
					this
					.breakpoints()
					.breakpoints as { [key: string]: boolean; };
				return !!bp[Breakpoints.Small];
			});

	isLaptop: ReturnType<typeof computed<boolean>> =
		computed(
			() =>
			{
				const bp: { [key: string]: boolean; } =
					this
					.breakpoints()
					.breakpoints as { [key: string]: boolean; };
				return !!bp[Breakpoints.Medium];
			});

	isDesktop: ReturnType<typeof computed<boolean>> =
		computed(
			() =>
			{
				const bp: { [key: string]: boolean; } =
					this
					.breakpoints()
					.breakpoints as { [key: string]: boolean; };
				return !!bp[Breakpoints.Large] || !!bp[Breakpoints.XLarge];
			});

	isXLarge: ReturnType<typeof computed<boolean>> =
		computed(
			() =>
			{
				const bp: { [key: string]: boolean; } =
					this
					.breakpoints()
					.breakpoints as { [key: string]: boolean; };
				return !!bp[Breakpoints.XLarge];
			});

	/**
	 * Helper: Is screen size 600px or larger (tablet and above)
	 */
	isTabletOrLarger: ReturnType<typeof computed<boolean>> =
		computed(
			() =>
			{
				return !this.isMobile();
			});

	/**
	 * Helper: Is screen size below 960px (mobile and tablet)
	 */
	isBelowLaptop: ReturnType<typeof computed<boolean>> =
		computed(
			() =>
			{
				return this.isMobile() || this.isTablet();
			});

	/**
	 * Helper: Is screen size 960px or larger (laptop and desktop)
	 */
	isLaptopOrLarger: ReturnType<typeof computed<boolean>> =
		computed(
			() =>
			{
				return this.isLaptop() || this.isDesktop() || this.isXLarge();
			});

	/**
	 * Sidebar mode based on screen size
	 * - Below 960px: 'over' (overlay, full-width content)
	 * - 960px and above: 'side' (push content)
	 */
	sidebarMode: ReturnType<typeof computed<"over" | "side">> =
		computed(
			() =>
			{
				if (this.isBelowLaptop())
				{
					return "over";
				}
				return "side";
			});

	/**
	 * Whether sidebar should be opened
	 * On mobile/tablet: closed by default, managed by gestures/backdrop
	 * On desktop: always starts open, only toggled via header
	 */
	sidebarOpened: ReturnType<typeof computed<boolean>> =
		computed(
			() =>
			{
				return this.sidebarExpanded();
			});

	/**
	 * Toggle sidebar expanded state
	 */
	toggleSidebar(): void
	{
		this.sidebarExpanded.update(
			(expanded) => !expanded);
		this.saveSessionSidebarState(this.sidebarExpanded());
	}

	/**
	 * Set sidebar expanded state
	 */
	setSidebarExpanded(expanded: boolean): void
	{
		this.sidebarExpanded.set(expanded);
		this.saveSessionSidebarState(expanded);
	}

	/**
	 * Close sidebar (useful for mobile after navigation)
	 */
	closeSidebar(): void
	{
		this.sidebarExpanded.set(false);
		this.saveSessionSidebarState(false);
	}

	/**
	 * Open sidebar
	 */
	openSidebar(): void
	{
		this.sidebarExpanded.set(true);
		this.saveSessionSidebarState(true);
	}

	/**
	 * Get sidebar state for current session
	 * Always returns true (open) on fresh page load/refresh
	 * Uses sessionStorage to track user's explicit close action within session
	 */
	private getSessionSidebarState(): boolean
	{
		// Check if browser environment
		if (
			typeof window === "undefined"
				|| typeof sessionStorage === "undefined")
		{
			return true; // Default to open in SSR
		}

		const sessionValue: string | null =
			sessionStorage.getItem(
				this.SIDEBAR_SESSION_KEY);

		// If no session value, this is a fresh load - start open
		if (isNullOrUndefined(sessionValue))
		{
			return true;
		}

		// Return the session-stored value
		return sessionValue === "true";
	}

	/**
	 * Save sidebar state to sessionStorage
	 * Only tracks within current browser session
	 */
	private saveSessionSidebarState(expanded: boolean): void
	{
		if (
			typeof window === "undefined"
				|| typeof sessionStorage === "undefined")
		{
			return;
		}

		sessionStorage.setItem(this.SIDEBAR_SESSION_KEY, expanded.toString());
	}
}
