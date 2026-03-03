import {
	computed,
	DestroyRef,
	inject,
	Injectable,
	Signal,
	signal,
	WritableSignal
} from "@angular/core";
import { APP_BREAKPOINTS, STORAGE_KEYS } from "@shared/constants";
import { BreakpointSnapshot } from "@shared/models";
import { StorageService } from "@shared/services/storage.service";
import { isNullOrUndefined } from "@shared/utilities/null-check.utility";

/**
 * Service for managing application layout state.
 * Handles sidebar expansion, responsive breakpoints, and layout preferences.
 *
 * Uses the standard `window.matchMedia().addEventListener('change', ...)` API
 * instead of the Angular CDK BreakpointObserver, which relies on the
 * deprecated `MediaQueryList.addListener()` method.
 */
@Injectable(
	{
		providedIn: "root"
	})
export class LayoutService
{
	/**
	 * Destroy reference for cleanup.
	 * @type {DestroyRef}
	 * @private
	 * @readonly
	 */
	private readonly destroyRef: DestroyRef =
		inject(DestroyRef);

	/**
	 * Storage service for SSR-safe storage access.
	 * @type {StorageService}
	 * @private
	 * @readonly
	 */
	private readonly storageService: StorageService =
		inject(StorageService);

	/**
	 * Internal breakpoint state signal.
	 * Updated by `matchMedia` change listeners.
	 * @type {WritableSignal<BreakpointSnapshot>}
	 * @private
	 */
	private readonly _breakpointState: WritableSignal<BreakpointSnapshot> =
		signal<BreakpointSnapshot>(
			{ matches: false, breakpoints: {} });

	/**
	 * Sidebar expanded state.
	 * On fresh load: open in side mode (≥ 960px), closed in overlay mode (< 960px).
	 * Within a session: persists the user's last explicit toggle.
	 * @type {WritableSignal<boolean>}
	 */
	sidebarExpanded: WritableSignal<boolean> =
		signal<boolean>(
			this.getSessionSidebarState());

	/**
	 * Signal representing the current breakpoint state.
	 * @type {Signal<BreakpointSnapshot>}
	 */
	readonly breakpointSignal: Signal<BreakpointSnapshot> =
		this._breakpointState.asReadonly();

	/**
	 * Computed signal: Is screen size XSmall (mobile).
	 * @type {Signal<boolean>}
	 * @readonly
	 */
	readonly isMobile: Signal<boolean> =
		this.createBreakpointSignal(APP_BREAKPOINTS.XSmall);

	/**
	 * Computed signal: Is screen size Small (tablet).
	 * @type {Signal<boolean>}
	 * @readonly
	 */
	readonly isTablet: Signal<boolean> =
		this.createBreakpointSignal(APP_BREAKPOINTS.Small);

	/**
	 * Computed signal: Is screen size Medium (laptop).
	 * @type {Signal<boolean>}
	 * @readonly
	 */
	readonly isLaptop: Signal<boolean> =
		this.createBreakpointSignal(APP_BREAKPOINTS.Medium);

	/**
	 * Computed signal: Is screen size Large or XLarge (desktop).
	 * @type {Signal<boolean>}
	 * @readonly
	 */
	readonly isDesktop: Signal<boolean> =
		this.createBreakpointSignal(
			APP_BREAKPOINTS.Large,
			APP_BREAKPOINTS.XLarge);

	/**
	 * Computed signal: Is screen size XLarge.
	 * @type {Signal<boolean>}
	 * @readonly
	 */
	readonly isXLarge: Signal<boolean> =
		this.createBreakpointSignal(APP_BREAKPOINTS.XLarge);

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
	 * Sidebar mode based on screen size.
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
	 * Constructor: initializes breakpoint observers using modern
	 * `matchMedia().addEventListener('change', ...)` API.
	 */
	constructor()
	{
		this.initializeBreakpoints();
	}

	/**
	 * Creates a computed signal that checks if any of the specified breakpoints match.
	 * @param {string[]} queries
	 * Media query strings to check.
	 * @returns {Signal<boolean>}
	 * Signal that emits true when any breakpoint matches.
	 * @private
	 */
	private createBreakpointSignal(...queries: string[]): Signal<boolean>
	{
		return computed(
			() =>
			{
				const breakpoints: Readonly<Record<string, boolean>> =
					this._breakpointState().breakpoints;
				return queries.some(
					(query: string) =>
						breakpoints[query] === true);
			});
	}

	/**
	 * Initializes matchMedia listeners for all breakpoints.
	 * Uses the modern `addEventListener('change', ...)` API.
	 * @private
	 * @returns {void}
	 */
	private initializeBreakpoints(): void
	{
		const queries: string[] =
			Object.values(APP_BREAKPOINTS);

		const initialBreakpoints: Record<string, boolean> = {};

		for (const query of queries)
		{
			const mediaQueryList: MediaQueryList =
				window.matchMedia(query);

			initialBreakpoints[query] =
				mediaQueryList.matches;

			const handler: (event: MediaQueryListEvent) => void =
				(event: MediaQueryListEvent): void =>
				{
					this.updateBreakpoint(
						query,
						event.matches);
				};

			mediaQueryList.addEventListener(
				"change",
				handler);

			this.destroyRef.onDestroy(
				() =>
				{
					mediaQueryList.removeEventListener(
						"change",
						handler);
				});
		}

		const hasMatch: boolean =
			Object
				.values(initialBreakpoints)
				.some(
					(matched: boolean) => matched);

		this._breakpointState.set(
			{
				matches: hasMatch,
				breakpoints: { ...initialBreakpoints }
			});
	}

	/**
	 * Updates a single breakpoint match and recomputes aggregate state.
	 * @param {string} query
	 * The media query that changed.
	 * @param {boolean} matches
	 * Whether the query now matches.
	 * @private
	 * @returns {void}
	 */
	private updateBreakpoint(
		query: string,
		matches: boolean): void
	{
		const current: BreakpointSnapshot =
			this._breakpointState();

		const updatedBreakpoints: Record<string, boolean> =
			{ ...current.breakpoints, [query]: matches };

		const hasMatch: boolean =
			Object
				.values(updatedBreakpoints)
				.some(
					(matched: boolean) => matched);

		this._breakpointState.set(
			{
				matches: hasMatch,
				breakpoints: updatedBreakpoints
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
	 * On fresh page load: open when viewport is laptop-or-larger (side mode),
	 * closed when below laptop (overlay mode) to avoid covering content.
	 * Uses sessionStorage to track the user's explicit toggle within the session.
	 * @returns {boolean}
	 * True when sidebar is considered open for the current session.
	 */
	private getSessionSidebarState(): boolean
	{
		const sessionValue: string | null =
			this.storageService.getSessionItem(
				STORAGE_KEYS.SIDEBAR_SESSION);

		// If no session value, this is a fresh load.
		// Start closed when viewport is below the laptop threshold (< 960px)
		// to avoid an overlay panel immediately covering page content.
		if (isNullOrUndefined(sessionValue))
		{
			return window.matchMedia("(min-width: 960px)").matches;
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