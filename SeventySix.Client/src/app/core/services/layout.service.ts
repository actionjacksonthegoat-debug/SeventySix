import {
	Injectable,
	signal,
	computed,
	inject,
	PLATFORM_ID
} from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { BreakpointObserver, Breakpoints } from "@angular/cdk/layout";
import { toSignal } from "@angular/core/rxjs-interop";

/**
 * Service for managing application layout state
 * Handles sidebar expansion, responsive breakpoints, and layout preferences
 */
@Injectable({
	providedIn: "root"
})
export class LayoutService
{
	private platformId: Object = inject(PLATFORM_ID);
	private breakpointObserver: BreakpointObserver = inject(BreakpointObserver);
	private readonly SIDEBAR_STATE_KEY: string = "seventysix-sidebar-expanded";

	/**
	 * Sidebar expanded state
	 */
	sidebarExpanded: ReturnType<typeof signal<boolean>> = signal<boolean>(
		this.getInitialSidebarState()
	);

	/**
	 * Observe responsive breakpoints
	 * Using Angular CDK Breakpoints constants:
	 * - XSmall: (max-width: 599.98px) - Mobile phones
	 * - Small: (min-width: 600px) and (max-width: 959.98px) - Tablets
	 * - Medium and above: (min-width: 960px) - Laptop and desktop
	 */
	private breakpoints$: ReturnType<typeof this.breakpointObserver.observe> =
		this.breakpointObserver.observe([
			Breakpoints.XSmall, // (max-width: 599.98px)
			Breakpoints.Small, // (min-width: 600px) and (max-width: 959.98px)
			Breakpoints.Medium, // (min-width: 960px) and (max-width: 1279.98px)
			Breakpoints.Large, // (min-width: 1280px) and (max-width: 1919.98px)
			Breakpoints.XLarge // (min-width: 1920px)
		]);

	breakpoints: ReturnType<
		typeof toSignal<ReturnType<typeof this.breakpointObserver.observe>>
	> = toSignal(this.breakpoints$, {
		initialValue: { matches: false, breakpoints: {} }
	});

	/**
	 * Computed values for responsive behavior
	 */
	isMobile: ReturnType<typeof computed<boolean>> = computed(() =>
	{
		const bp: { [key: string]: boolean } = this.breakpoints()
			.breakpoints as { [key: string]: boolean };
		return !!bp[Breakpoints.XSmall];
	});

	isTablet: ReturnType<typeof computed<boolean>> = computed(() =>
	{
		const bp: { [key: string]: boolean } = this.breakpoints()
			.breakpoints as { [key: string]: boolean };
		return !!bp[Breakpoints.Small];
	});

	isLaptop: ReturnType<typeof computed<boolean>> = computed(() =>
	{
		const bp: { [key: string]: boolean } = this.breakpoints()
			.breakpoints as { [key: string]: boolean };
		return !!bp[Breakpoints.Medium];
	});

	isDesktop: ReturnType<typeof computed<boolean>> = computed(() =>
	{
		const bp: { [key: string]: boolean } = this.breakpoints()
			.breakpoints as { [key: string]: boolean };
		return !!bp[Breakpoints.Large] || !!bp[Breakpoints.XLarge];
	});

	isXLarge: ReturnType<typeof computed<boolean>> = computed(() =>
	{
		const bp: { [key: string]: boolean } = this.breakpoints()
			.breakpoints as { [key: string]: boolean };
		return !!bp[Breakpoints.XLarge];
	});

	/**
	 * Helper: Is screen size 600px or larger (tablet and above)
	 */
	isTabletOrLarger: ReturnType<typeof computed<boolean>> = computed(() =>
	{
		return !this.isMobile();
	});

	/**
	 * Helper: Is screen size below 960px (mobile and tablet)
	 */
	isBelowLaptop: ReturnType<typeof computed<boolean>> = computed(() =>
	{
		return this.isMobile() || this.isTablet();
	});

	/**
	 * Helper: Is screen size 960px or larger (laptop and desktop)
	 */
	isLaptopOrLarger: ReturnType<typeof computed<boolean>> = computed(() =>
	{
		return this.isLaptop() || this.isDesktop() || this.isXLarge();
	});

	/**
	 * Sidebar mode based on screen size
	 * - Below 960px: 'over' (overlay, full-width content)
	 * - 960px and above: 'side' (push content)
	 */
	sidebarMode: ReturnType<typeof computed<"over" | "side">> = computed(() =>
	{
		if (this.isBelowLaptop())
		{
			return "over";
		}
		return "side";
	});

	/**
	 * Whether sidebar should be opened by default
	 */
	sidebarOpened: ReturnType<typeof computed<boolean>> = computed(() =>
	{
		// On mobile/tablet, keep closed by default
		if (this.sidebarMode() === "over")
		{
			return false;
		}
		// On desktop, use expanded state
		return this.sidebarExpanded();
	});

	/**
	 * Toggle sidebar expanded state
	 */
	toggleSidebar(): void
	{
		this.sidebarExpanded.update((expanded) => !expanded);
		this.saveSidebarState(this.sidebarExpanded());
	}

	/**
	 * Set sidebar expanded state
	 */
	setSidebarExpanded(expanded: boolean): void
	{
		this.sidebarExpanded.set(expanded);
		this.saveSidebarState(expanded);
	}

	/**
	 * Close sidebar (useful for mobile after navigation)
	 */
	closeSidebar(): void
	{
		this.sidebarExpanded.set(false);
		this.saveSidebarState(false);
	}

	/**
	 * Open sidebar
	 */
	openSidebar(): void
	{
		this.sidebarExpanded.set(true);
		this.saveSidebarState(true);
	}

	/**
	 * Get initial sidebar state from localStorage
	 */
	private getInitialSidebarState(): boolean
	{
		if (!isPlatformBrowser(this.platformId))
		{
			return true; // Default to expanded for SSR
		}

		const saved: string | null = localStorage.getItem(
			this.SIDEBAR_STATE_KEY
		);
		return saved === "true" || saved === null; // Default to true if not set
	}

	/**
	 * Save sidebar state to localStorage
	 */
	private saveSidebarState(expanded: boolean): void
	{
		if (!isPlatformBrowser(this.platformId))
		{
			return;
		}

		localStorage.setItem(this.SIDEBAR_STATE_KEY, expanded.toString());
	}
}
