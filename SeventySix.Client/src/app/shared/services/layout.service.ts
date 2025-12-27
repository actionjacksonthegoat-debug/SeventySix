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
import { isNullOrUndefined } from "@shared/utilities/null-check.utility";

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
	/**
	 * Platform identifier token from Angular DI (used to detect server vs browser).
	 * @type {Object}
	 * @private
	 * @readonly
	 */
	private platformId: Object =
		inject(PLATFORM_ID);

	/**
	 * Breakpoint observer for responsive breakpoint detection.
	 * @type {BreakpointObserver}
	 * @private
	 * @readonly
	 */
	private breakpointObserver: BreakpointObserver =
		inject(BreakpointObserver);

	/**
	 * Session storage key for persisting sidebar expanded state within a browser session.
	 * @type {string}
	 * @private
	 * @readonly
	 */
	private readonly SIDEBAR_SESSION_KEY: string = "seventysix-sidebar-session";

	/**
	 * Sidebar expanded state.
	 * Always starts open on fresh page load/refresh.
	 * Only persists closed state within the same session.
	 * @type {ReturnType<typeof signal<boolean>>}
	 */
	sidebarExpanded: ReturnType<typeof signal<boolean>> =
		signal<boolean>(
			this.getSessionSidebarState());

	/**
	 * Observe responsive breakpoints.
	 * Using Angular CDK Breakpoints constants:
	 * - XSmall: (max-width: 599.98px) - Mobile phones
	 * - Small: (min-width: 600px) and (max-width: 959.98px) - Tablets
	 * - Medium and above: (min-width: 960px) - Laptop and desktop
	 * @type {ReturnType<typeof this.breakpointObserver.observe>}
	 * @private
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

	/**
	 * Signal representing the current breakpoint state.
	 * @type {ReturnType<typeof toSignal<BreakpointState>>}
	 */
	breakpoints: ReturnType<typeof toSignal<BreakpointState>> =
		toSignal(
			this.breakpoints$,
			{
				initialValue: { matches: false, breakpoints: {} }
			});

	/**
	 * Computed values for responsive behavior.
	 * @type {ReturnType<typeof computed<boolean>>}
	 * @readonly
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

	/**
	 * Computed values for responsive behavior.
	 * @type {ReturnType<typeof computed<boolean>>}
	 * @readonly
	 */
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

	/**
	 * Computed values for responsive behavior.
	 * @type {ReturnType<typeof computed<boolean>>}
	 * @readonly
	 */
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

	/**
	 * Computed values for responsive behavior.
	 * @type {ReturnType<typeof computed<boolean>>}
	 * @readonly
	 */
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

	/**
	 * Computed values for responsive behavior.
	 * @type {ReturnType<typeof computed<boolean>>}
	 * @readonly
	 */
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
	 * Helper: Is screen size 600px or larger (tablet and above).
	 * @type {ReturnType<typeof computed<boolean>>}
	 * @readonly
	 */
	isTabletOrLarger: ReturnType<typeof computed<boolean>> =
		computed(
			() =>
			{
				return !this.isMobile();
			});

	/**
	 * Helper: Is screen size below 960px (mobile and tablet).
	 * @type {ReturnType<typeof computed<boolean>>}
	 * @readonly
	 */
	isBelowLaptop: ReturnType<typeof computed<boolean>> =
		computed(
			() =>
			{
				return this.isMobile() || this.isTablet();
			});

	/**
	 * Helper: Is screen size 960px or larger (laptop and desktop).
	 * @type {ReturnType<typeof computed<boolean>>}
	 * @readonly
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
	 * @type {ReturnType<typeof computed<"over" | "side">>}
	 * @readonly
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
	 * Whether sidebar should be opened.
	 * On mobile/tablet: closed by default, managed by gestures/backdrop.
	 * On desktop: always starts open, only toggled via header.
	 * @type {ReturnType<typeof computed<boolean>>}
	 * @readonly
	 */
	sidebarOpened: ReturnType<typeof computed<boolean>> =
		computed(
			() =>
			{
				return this.sidebarExpanded();
			});

	/**
	 * Toggle sidebar expanded state.
	 * @returns {void}
	 */
	toggleSidebar(): void
	{
		this.sidebarExpanded.update(
			(expanded) => !expanded);
		this.saveSessionSidebarState(this.sidebarExpanded());
	}

	/**
	 * Set sidebar expanded state.
	 * @param {boolean} expanded
	 * Whether the sidebar should be expanded (true) or collapsed (false).
	 * @returns {void}
	 */
	setSidebarExpanded(expanded: boolean): void
	{
		this.sidebarExpanded.set(expanded);
		this.saveSessionSidebarState(expanded);
	}

	/**
	 * Close sidebar (useful for mobile after navigation).
	 * @returns {void}
	 */
	closeSidebar(): void
	{
		this.sidebarExpanded.set(false);
		this.saveSessionSidebarState(false);
	}

	/**
	 * Open sidebar.
	 * @returns {void}
	 */
	openSidebar(): void
	{
		this.sidebarExpanded.set(true);
		this.saveSessionSidebarState(true);
	}

	/**
	 * Get sidebar state for current session.
	 * Always returns true (open) on fresh page load/refresh.
	 * Uses sessionStorage to track the user's explicit close action within the session.
	 * @returns {boolean}
	 * True when sidebar is considered open for the current session.
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
	 * Save sidebar state to sessionStorage.
	 * Only tracks within the current browser session.
	 * @param {boolean} expanded
	 * Whether the sidebar is expanded.
	 * @returns {void}
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
