import {
	BreakpointObserver,
	Breakpoints,
	BreakpointState
} from "@angular/cdk/layout";
import {
	computed,
	inject,
	Injectable,
	Signal,
	signal,
	WritableSignal
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { STORAGE_KEYS } from "@shared/constants";
import { StorageService } from "@shared/services/storage.service";
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
	 * Breakpoint observer for responsive breakpoint detection.
	 * @type {BreakpointObserver}
	 * @private
	 * @readonly
	 */
	private readonly breakpointObserver: BreakpointObserver =
		inject(BreakpointObserver);

	/**
	 * Storage service for SSR-safe storage access.
	 * @type {StorageService}
	 * @private
	 * @readonly
	 */
	private readonly storageService: StorageService =
		inject(StorageService);

	/**
	 * Sidebar expanded state.
	 * Always starts open on fresh page load/refresh.
	 * Only persists closed state within the same session.
	 * @type {WritableSignal<boolean>}
	 */
	sidebarExpanded: WritableSignal<boolean> =
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
	private readonly breakpoints$: ReturnType<typeof this.breakpointObserver.observe> =
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
	 * @type {Signal<BreakpointState>}
	 */
	readonly breakpoints: Signal<BreakpointState> =
		toSignal(
			this.breakpoints$,
			{
				initialValue: { matches: false, breakpoints: {} }
			});

	/**
	 * Computed signal: Is screen size XSmall (mobile).
	 * @type {Signal<boolean>}
	 * @readonly
	 */
	readonly isMobile: Signal<boolean> =
		this.createBreakpointSignal(Breakpoints.XSmall);

	/**
	 * Computed signal: Is screen size Small (tablet).
	 * @type {Signal<boolean>}
	 * @readonly
	 */
	readonly isTablet: Signal<boolean> =
		this.createBreakpointSignal(Breakpoints.Small);

	/**
	 * Computed signal: Is screen size Medium (laptop).
	 * @type {Signal<boolean>}
	 * @readonly
	 */
	readonly isLaptop: Signal<boolean> =
		this.createBreakpointSignal(Breakpoints.Medium);

	/**
	 * Computed signal: Is screen size Large or XLarge (desktop).
	 * @type {Signal<boolean>}
	 * @readonly
	 */
	readonly isDesktop: Signal<boolean> =
		this.createBreakpointSignal(
			Breakpoints.Large,
			Breakpoints.XLarge);

	/**
	 * Computed signal: Is screen size XLarge.
	 * @type {Signal<boolean>}
	 * @readonly
	 */
	readonly isXLarge: Signal<boolean> =
		this.createBreakpointSignal(Breakpoints.XLarge);

	/**
	 * Helper: Is screen size 600px or larger (tablet and above).
	 * @type {Signal<boolean>}
	 * @readonly
	 */
	readonly isTabletOrLarger: Signal<boolean> =
		computed(
			() =>
			{
				return !this.isMobile();
			});

	/**
	 * Helper: Is screen size below 960px (mobile and tablet).
	 * @type {Signal<boolean>}
	 * @readonly
	 */
	readonly isBelowLaptop: Signal<boolean> =
		computed(
			() =>
			{
				return this.isMobile() || this.isTablet();
			});

	/**
	 * Helper: Is screen size 960px or larger (laptop and desktop).
	 * @type {Signal<boolean>}
	 * @readonly
	 */
	readonly isLaptopOrLarger: Signal<boolean> =
		computed(
			() =>
			{
				return this.isLaptop() || this.isDesktop() || this.isXLarge();
			});

	/**
	 * Sidebar mode based on screen size
	 * - Below 960px: 'over' (overlay, full-width content)
	 * - 960px and above: 'side' (push content)
	 * @type {Signal<"over" | "side">}
	 * @readonly
	 */
	readonly sidebarMode: Signal<"over" | "side"> =
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
	 * @type {Signal<boolean>}
	 * @readonly
	 */
	readonly sidebarOpened: Signal<boolean> =
		computed(
			() =>
			{
				return this.sidebarExpanded();
			});

	/**
	 * Creates a computed signal that checks if any of the specified breakpoints match.
	 * @param {string[]} breakpointKeys
	 * Breakpoint constants to check.
	 * @returns {Signal<boolean>}
	 * Signal that emits true when any breakpoint matches.
	 * @private
	 */
	private createBreakpointSignal(...breakpointKeys: string[]): Signal<boolean>
	{
		return computed(
			() =>
			{
				const breakpointState: { [key: string]: boolean; } =
					this.breakpoints().breakpoints as {
						[key: string]: boolean;
					};
				return breakpointKeys.some(
					(breakpointKey: string) =>
						breakpointState[breakpointKey] === true);
			});
	}

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
		const sessionValue: string | null =
			this.storageService.getSessionItem(
				STORAGE_KEYS.SIDEBAR_SESSION);

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
		this.storageService.setSessionItem(
			STORAGE_KEYS.SIDEBAR_SESSION,
			expanded.toString());
	}
}
